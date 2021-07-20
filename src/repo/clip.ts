import { Clip } from "../core/clip/clip-models";
import ClipModel, { IClip } from "./models/Clip";

function toClip(clip: IClip): Clip {
  const actualClip: Clip = {
    id: clip._id,
    download_status: clip.download_status,
    title: clip.title,
    twitch_id: clip.twitch_id,
    game_id: clip.game_id,
    broadcaster_id: clip.broadcaster_id,
    broadcaster_name: clip.broadcaster_name,
    view_count: clip.view_count,
    url: clip.url,
    thumbnail_url: clip.thumbnail_url,
    language: clip.language,
    download_path: clip.download_path,
    scraped_url: clip.scraped_url,
    duration: clip.duration,
    tags: clip.tags,
    video_id: clip.video_id,
  };
  return actualClip;
}

export async function upsertClip(clip: Clip): Promise<Clip | null> {
  const upsertClip = await ClipModel.findOneAndUpdate(
    { twitch_id: clip.twitch_id },
    {
      ...clip,
    },
    { upsert: true, new: true }
  );

  return toClip(upsertClip);
}

export async function getClipByTwitchId(
  twitch_id: string
): Promise<Clip | null> {
  const existingClip = await ClipModel.findOne({ twitch_id });
  return existingClip && toClip(existingClip);
}

export async function getClipById(id: string): Promise<Clip | null> {
  const existingClip = await ClipModel.findById(id);
  return existingClip && toClip(existingClip);
}

export async function listClips(
  game_id?: string,
  download_status?: string,
  tag?: string,
  video_id?: string
): Promise<Clip[]> {
  const and: any[] = [];
  if (game_id) {
    and.push({ game_id });
  }
  if (download_status) {
    and.push({ download_status });
  }
  if (video_id) {
    and.push({ video_id });
  }
  if (tag) {
    and.push({ tags: { $regex: tag } });
  }
  const andString: any =
    and.length > 0
      ? {
          $and: and,
        }
      : {};
  const existingClips = await ClipModel.find(andString);
  return existingClips.map((existingClip) => toClip(existingClip));
}

export async function removeAll(game_id?: string): Promise<void> {
  await ClipModel.deleteMany(game_id ? { game_id } : {});
}
