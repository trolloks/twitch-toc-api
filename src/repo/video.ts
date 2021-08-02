import { Video } from "../core/video/video-models";
import VideoModel, { IVideo } from "./models/Video";

function toVideo(video: IVideo): Video {
  return {
    id: video._id,
    download_path: video.download_path,
    twitch_id: video.twitch_id,
    game_id: video.game_id,
    tags: video.tags,
    duration: video.duration,
  } as Video;
}

export async function upsertVideo(video: Video): Promise<Video | null> {
  if (video.id) {
    const upsertVideo = await VideoModel.findByIdAndUpdate(
      video.id,
      {
        ...video,
      },
      { upsert: true, new: true }
    );
    return upsertVideo.value ? toVideo(upsertVideo.value) : null;
  } else {
    const upsertVideo = await VideoModel.create({
      ...video,
    });
    return upsertVideo ? toVideo(upsertVideo) : null;
  }
}

export async function getVideoById(id: string): Promise<Video | null> {
  const existingVideo = await VideoModel.findById(id);
  return existingVideo && toVideo(existingVideo);
}

export async function listVideos(game_id?: string): Promise<Video[]> {
  const existingVideos = await VideoModel.find((game_id && { game_id }) || {});
  return existingVideos.map((existingVideo) => toVideo(existingVideo));
}

export async function removeAll(): Promise<void> {
  await VideoModel.deleteMany({});
}

export async function removeVideo(id: string): Promise<void> {
  await VideoModel.findByIdAndDelete(id);
}
