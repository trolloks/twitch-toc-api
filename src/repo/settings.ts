import { Settings } from "../core/settings/settings-models";
import SettingsModel, { ISettings } from "./models/Settings";

function toSettings(settings: ISettings): Settings {
  return {
    id: settings._id,
    user_id: settings.user_id,
    banner_path: settings.banner_path,
    font_path: settings.font_path,
    gif_path: settings.gif_path,
    intro_path: settings.intro_path,
    outro_path: settings.outro_path,
  } as Settings;
}

export async function upsertSettings(
  settings: Settings
): Promise<Settings | null> {
  if (settings.id) {
    const upsertSettings = await SettingsModel.findByIdAndUpdate(
      settings.id,
      {
        ...settings,
      },
      { upsert: true, new: true }
    );
    return upsertSettings.value ? toSettings(upsertSettings.value) : null;
  } else {
    const upsertSettings = await SettingsModel.create({
      ...settings,
    });
    return upsertSettings ? toSettings(upsertSettings) : null;
  }
}

export async function getSettingsByUserId(
  user_id: string
): Promise<Settings[] | null> {
  const existingSettings = await SettingsModel.find({ user_id });
  return existingSettings.map((existingSetting) => toSettings(existingSetting));
}

export async function getSettingsById(id: string): Promise<Settings | null> {
  const existingSetting = await SettingsModel.findById(id);
  return existingSetting ? toSettings(existingSetting) : null;
}
