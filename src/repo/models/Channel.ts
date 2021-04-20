import { SchemaDefinition } from "mongoose";
import { wrapper, Document } from "../utils/mongoose-helpers";

export interface IChannel extends Document {
  name: string;
  twitch_id?: string;
  game_id?: string;
}

const ChannelSchema: SchemaDefinition = {
  name: { type: String },
  twitch_id: { default: undefined, type: String },
  game_id: { default: undefined, type: String },
};

export default wrapper<IChannel>("Channel", ChannelSchema);
