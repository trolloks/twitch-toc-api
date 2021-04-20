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
};

export default wrapper<IClip>("Clip", ClipSchema);
