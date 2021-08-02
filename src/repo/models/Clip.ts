import { SchemaDefinition } from "mongoose";
import { wrapper, Document } from "../utils/mongoose-helpers";

export interface IClip extends Document {
  twitch_id: string;
  game_id?: string;
  title: string;
  url: string;
  thumbnail_url: string;
  broadcaster_name: string;
  broadcaster_id: string;
  view_count: string;
  language: string;
  download_status: string;
  download_path?: string;
  scraped_url?: string;
  duration?: number;
  tags: string[];
  video_id?: string;
  video_order?: number;
}

const ClipSchema: SchemaDefinition = {
  twitch_id: { type: String },
  game_id: { default: undefined, type: String },
  title: { type: String },
  url: { type: String },
  thumbnail_url: { type: String },
  broadcaster_name: { type: String },
  broadcaster_id: { type: String },
  view_count: { type: String },
  language: { type: String },
  download_status: { type: String },
  download_path: { default: undefined, type: String },
  scraped_url: { default: undefined, type: String },
  video_id: { default: undefined, type: String },
  video_order: { default: undefined, type: Number },
  duration: { default: undefined, type: Number },
  tags: [{ type: String }],
};

export default wrapper<IClip>("Clip", ClipSchema);
