import fs from "fs";
import axios from "axios";
import Path from "path";
import { spawn } from "child_process";
import { getVideoDurationInSeconds } from "get-video-duration";
import { getClips, scrapeDownloadUrl } from "../../gateway/twitch-gateway";
import { Clip } from "./clip-models";
import * as clipRepo from "../../repo/clip";
import { format } from "date-fns";
import { Channel } from "../channel/channel-models";
import * as channelCore from "../channel/channel-core";
import * as videoCore from "../video/video-core";
import {
  FONT_PATH,
  BANNER_PATH,
  GIF_LOGO_PATH,
  INTRO_PATH,
  OUTRO_PATH,
  FILE_DOWNLOAD_PATH,
} from "../../env.json";
import uuid from "uuid";
import { deleteFile } from "../../utils/utils";

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
  console.log(tags);
  const clip = await getClip(id);
  if (!clip) {
    return;
  }
  clip.tags = tags;
  await clipRepo.upsertClip(clip);
}

async function triggerSpecificDownloadOnClip(clip: Clip): Promise<void> {
  const { twitch_id, scraped_url } = clip;
  const path = Path.resolve(FILE_DOWNLOAD_PATH, `${twitch_id}.mp4`);
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
    if (!fs.existsSync(FILE_DOWNLOAD_PATH)) {
      fs.mkdirSync(FILE_DOWNLOAD_PATH, 0x0744);
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

export async function processDownloads(game_id?: string): Promise<void> {
  const clips = await listClips(game_id, "READY");
  const video = await videoCore.upsertVideo({
    game_id,
  });
  for (let i = 0; i < clips.length; i++) {
    try {
      await triggerSpecificDownloadOnClip(clips[i]);
    } catch (err) {
      try {
        const path = Path.resolve(
          FILE_DOWNLOAD_PATH,
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
  fisherYates(clips);
  const paths: string[] = [];
  const actualFileNames: string[] = [];

  const outputPathDir = Path.resolve(FILE_DOWNLOAD_PATH, "processed");
  if (!fs.existsSync(outputPathDir)) {
    fs.mkdirSync(outputPathDir, 0x0744);
  }

  if (INTRO_PATH) {
    actualFileNames.push("intro.mts");
    const introPath = Path.resolve(outputPathDir, "intro.mts");
    if (!fs.existsSync(introPath)) {
      fs.copyFileSync(INTRO_PATH, introPath);
    }
  }

  for (let i = 0; i < clips.length; i++) {
    const { twitch_id, broadcaster_name } = clips[i];
    const path = Path.resolve(FILE_DOWNLOAD_PATH, `${twitch_id}.mp4`);
    await ffmpegUtil(
      `-y -i ${path} -ignore_loop 0 -i ${GIF_LOGO_PATH} -i ${BANNER_PATH} -filter_complex [2][0]scale2ref=w='iw':h='ow*6/100'[wm][vid];[1][vid]scale2ref=w='iw*10/100':h='ow'[wm2][vid];[vid][wm2]overlay=W-w:10:shortest=1[vid2];[vid2][wm]overlay=0:H-h,drawtext=text='${broadcaster_name}':x=18:y=H-th-18:fontfile='${FONT_PATH}':fontsize=64:fontcolor=white -acodec mp3 -q 0 ${Path.resolve(
        outputPathDir,
        `${twitch_id}.mts`
      )}`
    );

    paths.push(Path.resolve(outputPathDir, `${twitch_id}.mts`));
    actualFileNames.push(`${twitch_id}.mts`);
    console.log(`Processed ${twitch_id} successfully`);
  }

  if (OUTRO_PATH) {
    actualFileNames.push("outro.mts");
    const introPath = Path.resolve(outputPathDir, "outro.mts");
    if (!fs.existsSync(introPath)) {
      fs.copyFileSync(OUTRO_PATH, introPath);
    }
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
        FILE_DOWNLOAD_PATH,
        `${clips[i].twitch_id}.mp4`
      );
      console.log(`Deleting ${path}...`);
      fs.unlinkSync(path);
    }
    await videoCore.upsertVideo({
      ...video,
      download_path: finalFilePath,
      duration: await getVideoDurationInSeconds(finalFilePath),
    });
  }
}

function ffmpegUtil(params: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", params.split(" "), {
      cwd: Path.resolve("./"),
    });
    ffmpeg.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    ffmpeg.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
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
