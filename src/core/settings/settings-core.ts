import { Settings } from "./settings-models";
import * as settingsRepo from "../../repo/settings";

export async function upsertSettings(
  settings: Settings
): Promise<Settings | null> {
  return await settingsRepo.upsertSettings(settings);
}

export async function listSettings(user_id: string): Promise<Settings[]> {
  const dataUsers = await settingsRepo.getSettingsByUserId(user_id);
  if (dataUsers) {
    return dataUsers;
  }
  return [];
}

export async function getSettings(id: string): Promise<Settings | null> {
  return await settingsRepo.getSettingsById(id);
}
