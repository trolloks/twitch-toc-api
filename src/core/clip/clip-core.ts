import fs from "fs";
import axios from "axios";
import Path from "path";
import { getClips, scrapeDownloadUrl } from "../../gateway/twitch-gateway";
import { Clip } from "./clip-models";

export async function testDownload(
  broadcast_id: string,
  game_id: string
): Promise<void> {
  const clips = await listClips(broadcast_id, game_id);
  for (let i = 0; i < clips.length; i++) {
    const { url, twitch_id } = clips[i];
    const pathDir = Path.resolve("./", "videos");
    const path = Path.resolve(pathDir, `${twitch_id}.mp4`);
    if (fs.existsSync(path)) {
      console.log(`${path} already exists`);
      continue;
    }
    const downloadUrl = await scrapeDownloadUrl(url);
    if (downloadUrl) {
      if (!fs.existsSync(pathDir)) {
        fs.mkdirSync(pathDir, 0x0744);
      }
      const writer = fs.createWriteStream(path);
      console.log(`Scraped a valid download url - ${downloadUrl}`);
      const response = await axios({
        url: downloadUrl,
        method: "GET",
        responseType: "stream",
      });

      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(true));
        writer.on("error", () => reject);
      });
      writer.close();
      console.log(`Downloaded ${path} successfully`);
    }
  }
}

export async function listClips(
  broadcast_id: string,
  game_id: string,
  take?: number
): Promise<Clip[]> {
  var twitchClips = await getClips(broadcast_id, game_id, take || 20);
  return twitchClips.map(
    (twitchClip) =>
      ({
        twitch_id: twitchClip.id,
        url: twitchClip.url,
        language: twitchClip.language,
        view_count: twitchClip.view_count,
        title: twitchClip.title,
        broadcaster_name: twitchClip.broadcaster_name,
      } as Clip)
  );
}
