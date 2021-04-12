import { SchemaDefinition } from "mongoose";
import { wrapper, Document } from "../utils/mongoose-helpers";

export interface IGame extends Document {
  name: string;
  twitch_id?: string;
}

const GameSchema: SchemaDefinition = {
  name: { type: String },
  twitch_id: { default: undefined, type: String },
};

export default wrapper<IGame>("Game", GameSchema);
