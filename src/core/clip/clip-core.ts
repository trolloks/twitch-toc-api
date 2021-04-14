import fs from "fs";
import axios from "axios";
import Path from "path";
import { spawn } from "child_process";
import { getClips, scrapeDownloadUrl } from "../../gateway/twitch-gateway";
import { Clip } from "./clip-models";
import * as clipRepo from "../../repo/clip";
import { format } from "date-fns";

export async function triggerDownload(): Promise<void> {
  const clips = await listClips("WAITING");
  for (let i = 0; i < clips.length; i++) {
    const { url, twitch_id } = clips[i];
    const pathDir = Path.resolve("./", "videos");
    const path = Path.resolve(pathDir, `${twitch_id}.mp4`);
    if (fs.existsSync(path)) {
      console.log(`${path} already exists`);
      continue;
    }
    const downloadUrl = await scrapeDownloadUrl(url);
    if (downloadUrl) {
      if (!fs.existsSync(pathDir)) {
        fs.mkdirSync(pathDir, 0x0744);
      }
      const writer = fs.createWriteStream(path);
      console.log(`Scraped a valid download url - ${downloadUrl}`);
      const response = await axios({
        url: downloadUrl,
        method: "GET",
        responseType: "stream",
      });

      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(true));
        writer.on("error", () => reject());
      });
      writer.close();
      console.log(`Downloaded ${path} successfully`);
      const updatedClip = { ...clips[i], download_status: "DOWNLOADED" };
      await clipRepo.upsertClip(updatedClip);
    }
  }
}

export async function listClips(download_status?: string): Promise<Clip[]> {
  const dataUsers = await clipRepo.listClips(download_status);
  if (dataUsers) {
    return dataUsers;
  }
  return [];
}

export async function createClipsForTheDay(
  broadcast_id: string,
  game_id: string,
  take?: number
): Promise<void> {
  var twitchClips = await getClips(broadcast_id, game_id, take || 20);
  for (let i = 0; i < twitchClips.length; i++) {
    const twitchClip = twitchClips[i];
    const existingClip = await clipRepo.getClipByTwitchId(twitchClip.id);
    if (existingClip) {
      console.log(`Clip (${twitchClip.id}) exists, skipping.`);
      continue;
    }
    await clipRepo.upsertClip({
      twitch_id: twitchClip.id,
      url: twitchClip.url,
      language: twitchClip.language,
      view_count: twitchClip.view_count,
      title: twitchClip.title,
      broadcaster_name: twitchClip.broadcaster_name,
      broadcaster_id: twitchClip.broadcaster_id,
      download_status: "WAITING",
    } as Clip);
  }
}

export async function processDownloads(): Promise<void> {
  const clips = await listClips("DOWNLOADED");
  const paths: string[] = [];
  const actualFileNames: string[] = [];
  const fontDir = Path.resolve("./", "assets", "bones.ttf");
  const pathDir = Path.resolve("./", "videos");

  const outputPathDir = Path.resolve(pathDir, "processed");
  if (!fs.existsSync(outputPathDir)) {
    fs.mkdirSync(outputPathDir, 0x0744);
  }

  for (let i = 0; i < clips.length; i++) {
    const { twitch_id, broadcaster_name } = clips[i];
    const path = Path.resolve(pathDir, `${twitch_id}.mp4`);
    await ffmpegUtil(
      `-y -i ${path} -vf drawtext=text='${broadcaster_name}':x=10:y=H-th-10:fontfile=../../../assets/bones.ttf:fontsize=72:fontcolor=white -q 0 ${Path.resolve(
        outputPathDir,
        `${twitch_id}.mts`
      )}`
    );

    paths.push(Path.resolve(outputPathDir, `${twitch_id}.mts`));
    actualFileNames.push(`${twitch_id}.mts`);
    console.log(`Processed ${twitch_id} successfully`);
    const updatedClip = { ...clips[i], download_status: "PROCESSED" };
    await clipRepo.upsertClip(updatedClip);
  }

  if (paths.length > 0 && actualFileNames.length > 0) {
    var listFileName = "list.txt",
      fileNames = "";

    // ffmpeg -f concat -i mylist.txt -c copy output
    actualFileNames.forEach(function (fileName, index) {
      fileNames = fileNames + "file " + "" + fileName + "\n";
    });

    fs.writeFileSync(Path.resolve(outputPathDir, listFileName), fileNames);
    await ffmpegUtil(
      `-y -f concat -i ${Path.resolve(
        outputPathDir,
        listFileName
      )} -c copy ${Path.resolve(outputPathDir, `concat.mts`)}`
    );
    paths.forEach((pathItem) => fs.unlinkSync(pathItem));
    fs.unlinkSync(Path.resolve(outputPathDir, listFileName));
    await ffmpegUtil(
      `-y -i ${Path.resolve(outputPathDir, `concat.mts`)} -q 0 ${Path.resolve(
        outputPathDir,
        `${format(new Date(), "yyyyMMddhhmmss")}.mp4`
      )}`
    );
    fs.unlinkSync(Path.resolve(outputPathDir, `concat.mts`));
  }
}

function ffmpegUtil(params: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", params.split(" "));
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

export async function deleteAll(): Promise<void> {
  await clipRepo.removeAll();
}
