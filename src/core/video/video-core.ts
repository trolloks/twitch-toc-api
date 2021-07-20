import { Video } from "./video-models";
import * as videoRepo from "../../repo/video";

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
