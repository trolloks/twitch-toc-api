import { SchemaDefinition } from "mongoose";
import { wrapper, Document } from "../utils/mongoose-helpers";

export interface ISettings extends Document {
  id: string;
  name?: string;
  user_id: string;
  font_path?: string;
  banner_path?: string;
  gif_path?: string;
  intro_path?: string;
  outro_path?: string;
}

const SettingsSchema: SchemaDefinition = {
  id: { type: String },
  name: { default: undefined, type: String },
  user_id: { type: String },
  font_path: { default: undefined, type: String },
  banner_path: { default: undefined, type: String },
  gif_path: { default: undefined, type: String },
  intro_path: { default: undefined, type: String },
  outro_path: { default: undefined, type: String },
};

export default wrapper<ISettings>("Settings", SettingsSchema);
