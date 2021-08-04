import fs from "fs";
import axios from "axios";
import Path from "path";
import { spawn } from "child_process";
import { S3 } from "aws-sdk";
import { getVideoDurationInSeconds } from "get-video-duration";
import { getClips, scrapeDownloadUrl } from "../../gateway/twitch-gateway";
import { Clip } from "./clip-models";
import * as clipRepo from "../../repo/clip";
import { format } from "date-fns";
import { Channel } from "../channel/channel-models";
import * as channelCore from "../channel/channel-core";
import * as videoCore from "../video/video-core";
import * as settingsCore from "../settings/settings-core";
import uuid from "uuid";
import { deleteFile } from "../../utils/utils";
import { Settings } from "../settings/settings-models";
import { Part } from "aws-sdk/clients/s3";

const {
  FILE_DOWNLOAD_PATH,
  AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET,
} = process.env;

function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time || 1000);
  });
}

function fisherYates(array: any[]) {
  var count = array.length,
    randomnumber,
    temp;
  while (count) {
    randomnumber = (Math.random() * count--) | 0;
    temp = array[count];
    array[count] = array[randomnumber];
    array[randomnumber] = temp;
  }
}
export async function triggerSpecificDownload(id: string): Promise<void> {
  const clip = await getClip(id);
  if (!clip) {
    return;
  }
  await triggerSpecificDownloadOnClip(clip);
}

export async function addTagToClip(id: string, tags: string[]): Promise<void> {
  const clip = await getClip(id);
  if (!clip) {
    return;
  }
  clip.tags = tags;
  await clipRepo.upsertClip(clip);
}

async function triggerSpecificDownloadOnClip(clip: Clip): Promise<void> {
  const { twitch_id, scraped_url } = clip;
  const path = Path.resolve(FILE_DOWNLOAD_PATH || "", `${twitch_id}.mp4`);
  if (fs.existsSync(path)) {
    console.log(`${path} already exists`);
    const updatedClip = {
      ...clip,
      download_status: "DOWNLOADED",
      download_path: path,
    };
    await clipRepo.upsertClip(updatedClip);
    return;
  }
  console.log("Checked if file already exists");

  if (scraped_url) {
    if (!fs.existsSync(FILE_DOWNLOAD_PATH || "")) {
      fs.mkdirSync(FILE_DOWNLOAD_PATH || "", 0x0744);
    }

    const writer = fs.createWriteStream(path);
    try {
      console.log(`Trying the download url - ${scraped_url}`);
      const response = await axios({
        url: scraped_url,
        method: "GET",
        responseType: "stream",
      });

      console.log("Successfully read the download url");
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(true));
        writer.on("error", () => reject());
      });
      writer.close();
      console.log(`Downloaded ${path} successfully`);
      const duration = await getVideoDurationInSeconds(path);
      const updatedClip = {
        ...clip,
        download_status: "DOWNLOADED",
        download_path: path,
        duration,
      };
      await clipRepo.upsertClip(updatedClip);
    } catch (err) {
      writer.close();
      console.error(err.response.status);
      throw err;
    }
  }
}

export async function triggerDownload(game_id?: string): Promise<void> {
  const clips = await listClips(game_id, "WAITING");
  for (let i = 0; i < clips.length; i++) {
    await triggerSpecificDownloadOnClip(clips[i]);
  }
}

export async function listClips(
  game_id?: string,
  download_status?: string,
  tag?: string,
  video_id?: string
): Promise<Clip[]> {
  const dataUsers = await clipRepo.listClips(
    game_id,
    download_status,
    tag,
    video_id
  );
  if (dataUsers) {
    return dataUsers;
  }
  return [];
}

export async function getClip(id: string): Promise<Clip | null> {
  return await clipRepo.getClipById(id);
}

export async function createClipsForTheDay(
  broadcast_id: string,
  game_id: string,
  start_date?: string,
  take?: number
): Promise<void> {
  let start_date_Date: undefined | Date = undefined;
  if (start_date) {
    start_date_Date = new Date(Date.parse(start_date));
  }

  let broadcasters: Channel[] = [];
  if (!broadcast_id && game_id) {
    broadcasters = await channelCore.listChannels(game_id);
  } else if (broadcast_id && game_id) {
    const broadcaster = await channelCore.getChannelByTwitchId(broadcast_id);
    if (broadcaster) {
      broadcasters.push(broadcaster);
    }
  } else {
    return;
  }

  // Add all broadcasters
  for (let i = 0; i < broadcasters.length; i++) {
    console.log(`Processing clips for ${broadcasters[i].name}...`);
    const twitchClips = await getClips(
      broadcasters[i].twitch_id || "",
      game_id,
      take || 20,
      start_date_Date
    );
    console.log(
      `Got ${twitchClips.length} clips back from ${broadcasters[i].name}.`
    );
    for (let i = 0; i < twitchClips.length; i++) {
      const twitchClip = twitchClips[i];
      const existingClip = await clipRepo.getClipByTwitchId(twitchClip.id);
      if (existingClip) {
        console.log(`Clip (${twitchClip.id}) exists, skipping.`);
        continue;
      }
      console.log(`Clip (${twitchClip.id}) is new, adding.`);
      const downloadUrl = await scrapeDownloadUrl(twitchClip.url);
      await clipRepo.upsertClip({
        ...twitchClip,
        twitch_id: twitchClip.id,
        id: undefined,
        download_status: "WAITING",
        scraped_url: downloadUrl,
        tags: [format(new Date(), "yyyy-MM-dd")],
      } as Clip);
    }
    // dont nuke the api
    await sleep(200);
  }

  if (!broadcast_id && game_id) {
    // Add overall best game clips
    const twitchClips = await getClips(
      "",
      game_id,
      take || 20,
      start_date_Date
    );

    console.log(`Got ${twitchClips.length} clips back from twitch.`);
    for (let i = 0; i < twitchClips.length; i++) {
      const twitchClip = twitchClips[i];
      const existingClip = await clipRepo.getClipByTwitchId(twitchClip.id);
      if (existingClip) {
        console.log(`Clip (${twitchClip.id}) exists, skipping.`);
        continue;
      }
      console.log(`Clip (${twitchClip.id}) is new, adding.`);
      const downloadUrl = await scrapeDownloadUrl(twitchClip.url);
      const upsertedClip: Clip = {
        ...twitchClip,
        twitch_id: twitchClip.id,
        id: undefined,
        download_status: "WAITING",
        scraped_url: downloadUrl,
        tags: [format(new Date(), "yyyy-MM-dd")],
      };
      await clipRepo.upsertClip(upsertedClip);
    }
  }
}

export async function setState(
  fromState: string,
  toState: string,
  twitch_id?: string,
  game_id?: string,
  tag?: string
) {
  if (twitch_id) {
    const clip = await clipRepo.getClipByTwitchId(twitch_id);
    if (!clip) {
      return;
    }
    await clipRepo.upsertClip({
      ...clip,
      download_status: toState,
      video_id: toState !== "PROCESSED" ? undefined : clip.video_id,
    });
  } else {
    const clips = await clipRepo.listClips(game_id, fromState, tag);
    if (!clips) {
      return;
    }
    for (let i = 0; i < clips.length; i++) {
      await clipRepo.upsertClip({
        ...clips[i],
        download_status: toState,
        video_id: toState !== "PROCESSED" ? undefined : clips[i].video_id,
      });
    }
  }
}

export async function setStateOfAll(twitch_id: string) {
  const clip = await clipRepo.getClipByTwitchId(twitch_id);
  if (!clip) {
    return;
  }
  await clipRepo.upsertClip({ ...clip, download_status: "REJECTED" });
}

export async function rescrapeUrl(id: string) {
  const clip = await getClip(id);
  if (clip) {
    const scraped_url = await scrapeDownloadUrl(clip.url);
    await clipRepo.upsertClip({ ...clip, scraped_url });
  }
}

export async function processDownloads(
  settings_id?: string,
  game_id?: string
): Promise<void> {
  if (!game_id) {
    return;
  }
  const clips = await listClips(game_id, "READY");
  const settings =
    (settings_id && (await settingsCore.getSettings(settings_id))) ||
    new Settings();
  const { banner_path, font_path, gif_path, intro_path, outro_path } = settings;
  const video = await videoCore.upsertVideo({
    game_id,
  });
  for (let i = 0; i < clips.length; i++) {
    try {
      await triggerSpecificDownloadOnClip(clips[i]);
    } catch (err) {
      try {
        const path = Path.resolve(
          FILE_DOWNLOAD_PATH || "",
          `${clips[i].twitch_id}.mp4`
        );
        fs.unlinkSync(path);
        console.log(`Deleted ${path}`);
        const url = await scrapeDownloadUrl(clips[i].url);
        await triggerSpecificDownloadOnClip({ ...clips[i], scraped_url: url });
      } catch (err) {
        console.error(err.response);
        return;
      }
    }

    const updatedClip = {
      ...clips[i],
      download_status: "PROCESSED",
      video_id: video?.id,
    };
    await clipRepo.upsertClip(updatedClip);
  }
  console.log("finished downloading");
  fisherYates(clips); // Randomize order
  const paths: string[] = [];
  const actualFileNames: string[] = [];

  const outputPathDir = Path.resolve(FILE_DOWNLOAD_PATH || "");
  if (!fs.existsSync(outputPathDir)) {
    fs.mkdirSync(outputPathDir, 0x0744);
  }

  if (intro_path) {
    actualFileNames.push("intro.mts");
    const response = await axios({
      url: intro_path,
      method: "GET",
      responseType: "stream",
    });

    const introPath = Path.resolve(outputPathDir, "intro.mts");
    const writer = fs.createWriteStream(introPath);
    response.data.pipe(writer);
    console.log(`Successfully read the intro url, downloading to ${introPath}`);
  }

  for (let i = 0; i < clips.length; i++) {
    const { twitch_id, broadcaster_name } = clips[i];
    const path = Path.resolve(FILE_DOWNLOAD_PATH || "", `${twitch_id}.mp4`);
    const gifText = gif_path ? ` -ignore_loop 0 -i ${gif_path}` : "";
    let tempFont = font_path;
    if (
      font_path &&
      (font_path.startsWith("https://") || font_path.startsWith("http://"))
    ) {
      const response = await axios({
        url: font_path,
        method: "GET",
        responseType: "stream",
      });

      const path = Path.resolve(FILE_DOWNLOAD_PATH || "", `onlineFont.ttf`);
      const writer = fs.createWriteStream(path);
      response.data.pipe(writer);
      tempFont = path.replace(/\\/g, "/").replace(/\:\//g, "\\\\:/");
      console.log(`Successfully read the font url, downloading to ${tempFont}`);
    }
    const bannerText =
      banner_path && tempFont
        ? ` -i ${banner_path} -filter_complex [2][0]scale2ref=w='iw':h='ow*6/100'[wm][vid];[1][vid]scale2ref=w='iw*10/100':h='ow'[wm2][vid];[vid][wm2]overlay=W-w:10:shortest=1[vid2];[vid2][wm]overlay=0:H-h,drawtext=text='${broadcaster_name}':x=18:y=H-th-18:fontfile='${tempFont}':fontsize=64:fontcolor=white`
        : "";
    const ffmpegCommand = `-y -i ${path}${gifText}${bannerText} -acodec mp3 -q 0 ${Path.resolve(
      outputPathDir,
      `${twitch_id}.mts`
    )}`;
    console.log(`ffmpeg command=(${ffmpegCommand})`);
    await ffmpegUtil(ffmpegCommand);

    paths.push(Path.resolve(outputPathDir, `${twitch_id}.mts`));
    actualFileNames.push(`${twitch_id}.mts`);
    console.log(`Processed ${twitch_id} successfully`);
    const updatedClip = {
      ...clips[i],
      video_order: i + 1,
      download_status: "PROCESSED",
      video_id: video?.id,
    };
    await clipRepo.upsertClip(updatedClip);
  }

  if (outro_path) {
    actualFileNames.push("outro.mts");
    const response = await axios({
      url: outro_path,
      method: "GET",
      responseType: "stream",
    });

    const outroPath = Path.resolve(outputPathDir, "outro.mts");
    const writer = fs.createWriteStream(outroPath);
    response.data.pipe(writer);
    console.log(`Successfully read the outro url, downloading to ${outroPath}`);
  }

  if (paths.length > 0 && actualFileNames.length > 0) {
    var listFileName = "list.txt";
    const printNames = actualFileNames.map((i) => "file " + "" + i).join("\n");
    console.log(printNames);
    fs.writeFileSync(Path.resolve(outputPathDir, listFileName), printNames);
    console.log(`Created ${listFileName} successfully!`);
    await sleep(1000);
    await ffmpegUtil(
      `-y -f concat -i ${Path.resolve(
        outputPathDir,
        listFileName
      )} -c copy -acodec mp3 ${Path.resolve(outputPathDir, `concat.mts`)}`
    );
    console.log(`Created concatted mts successfully!`);
    await sleep(1000);
    console.log(`Started final processing...`);
    const finalFilePath = Path.resolve(
      outputPathDir,
      `${format(new Date(), "yyyyMMddhhmmss")}.mp4`
    );
    await ffmpegUtil(
      `-y -i ${Path.resolve(
        outputPathDir,
        `concat.mts`
      )} -acodec mp3 -q 0 ${finalFilePath}`
    );
    await sleep(1000);
    for (let i = 0; i < paths.length; i++) {
      console.log(`Deleting ${paths[i]}...`);
      fs.unlinkSync(paths[i]);
      await sleep(500);
    }
    console.log(`Deleting ${listFileName}...`);
    fs.unlinkSync(Path.resolve(outputPathDir, listFileName));
    console.log(`Deleting concat.ms...`);
    fs.unlinkSync(Path.resolve(outputPathDir, `concat.mts`));
    console.log(`Deleting source vids...`);
    for (let i = 0; i < clips.length; i++) {
      const path = Path.resolve(
        FILE_DOWNLOAD_PATH || "",
        `${clips[i].twitch_id}.mp4`
      );
      console.log(`Deleting ${path}...`);
      fs.unlinkSync(path);
    }

    const s3 = new S3({
      region: "eu-west-1",
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    });

    var buffer = fs.readFileSync(finalFilePath);
    const fileKey = `${format(new Date(), "yyyyMMddhhmmss")}.mp4`;
    const finalResult = await multipartUpload(s3, fileKey, buffer);

    await videoCore.upsertVideo({
      ...video,
      download_path: finalResult?.Location,
      duration: await getVideoDurationInSeconds(finalFilePath),
    });

    try {
      fs.unlinkSync(finalFilePath);
      console.log(`Deleted ${finalFilePath}`);
    } catch (err) {
      console.error(err);
    }
  }
}

async function multipartUpload(s3: S3, fileKey: string, buffer: Buffer) {
  const chunkSize = 5242881; // bytes
  const params = {
    Bucket: AWS_BUCKET || "",
    Key: fileKey,
    ACL: "public-read",
  };
  // Multipart
  console.log("Creating multipart upload for:", fileKey);
  const result = await s3.createMultipartUpload(params).promise();
  const { Bucket, Key, UploadId } = result;
  if (!Bucket || !Key || !UploadId) {
    return;
  }
  console.log(result);
  console.log("chunking...");
  let chunkArr = [];
  for (
    var rangeStart = 0;
    rangeStart < buffer.length;
    rangeStart += chunkSize
  ) {
    const end = Math.min(rangeStart + chunkSize, buffer.length);
    chunkArr.push(buffer.slice(rangeStart, end));
  }
  console.log("finished chunks...");
  const chunkyPromises = [];
  for (let i = 0; i < chunkArr.length; i += 1) {
    const chunkParams = {
      Body: chunkArr[i],
      Bucket,
      Key,
      PartNumber: i + 1,
      UploadId,
      ContentLength: chunkArr[i].length,
    };
    console.log(chunkParams);
    chunkyPromises.push(s3.uploadPart(chunkParams).promise());
  }
  const lastUpload = await Promise.all(chunkyPromises);
  const multipartMap = lastUpload.map((lastUploadItem, index) => {
    const multipart = {
      ETag: lastUploadItem.ETag,
      PartNumber: Number(index + 1),
    };
    console.log(multipart);
    return multipart;
  });

  var doneParams = {
    Bucket,
    Key,
    MultipartUpload: { Parts: multipartMap },
    UploadId,
  };

  console.log(doneParams);
  console.log("Completing upload...");
  const finalResult = await s3.completeMultipartUpload(doneParams).promise();
  console.log("Final upload data:", finalResult);
  return finalResult;
}

function ffmpegUtil(params: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", params.split(" "), {
      cwd: Path.resolve("./"),
    });

    ffmpeg.on("error", (error) => {
      console.log(`error: ${error.message}`);
      reject();
    });

    ffmpeg.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      resolve();
    });
  });
}

export async function deleteAll(game_id?: string): Promise<void> {
  await clipRepo.removeAll(game_id);
}
