import { SchemaDefinition } from "mongoose";
import { wrapper, Document } from "../utils/mongoose-helpers";

export interface IVideo extends Document {
  id: string;
  twitch_id?: string;
  game_id?: string;
  download_path?: string;
  duration?: number;
  tags: string[];
}

const VideoSchema: SchemaDefinition = {
  id: { type: String },
  tags: [{ type: String }],
  twitch_id: { default: undefined, type: String },
  game_id: { default: undefined, type: String },
  download_path: { default: undefined, type: String },
  duration: { default: undefined, type: Number },
};

export default wrapper<IVideo>("Video", VideoSchema);
