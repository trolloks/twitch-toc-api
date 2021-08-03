import fs from "fs";
import Path from "path";
import { Video } from "./video-models";
import * as videoRepo from "../../repo/video";
import * as clipCore from "../clip/clip-core";

export async function upsertVideo(video: Video): Promise<Video | null> {
  return await videoRepo.upsertVideo(video);
}

export async function listVideos(game_id?: string): Promise<Video[]> {
  const dataUsers = await videoRepo.listVideos(game_id);
  if (dataUsers) {
    return dataUsers;
  }
  return [];
}

export async function getVideo(id: string): Promise<Video | null> {
  return await videoRepo.getVideoById(id);
}

export async function deleteAllVideos(game_id?: string): Promise<void> {
  return await videoRepo.removeAll();
}

export async function deleteVideo(id: string): Promise<void> {
  const clips = await clipCore.listClips(undefined, undefined, undefined, id);
  if (clips) {
    for (let i = 0; i < clips.length; i += 1) {
      await clipCore.setState("PROCESSED", "WAITING", clips[0].twitch_id);
    }
  }
  const video = await getVideo(id);
  if (video && video.download_path) {
    try {
      fs.unlinkSync(video?.download_path);
      console.log(`Deleted ${video?.download_path}`);
    } catch (err) {
      console.error(err);
    }
  }
  return await videoRepo.removeVideo(id);
}
