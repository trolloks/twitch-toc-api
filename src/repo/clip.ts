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

export async function listClips(download_status?: string): Promise<Clip[]> {
  const existingClips = await (!download_status
    ? ClipModel.find()
    : ClipModel.find({
        download_status: download_status,
      }));
  return existingClips.map((existingClip) => toClip(existingClip));
}

export async function removeAll(): Promise<void> {
  await ClipModel.deleteMany({});
}
