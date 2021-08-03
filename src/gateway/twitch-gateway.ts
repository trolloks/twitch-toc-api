import axios from "axios";
import { format } from "date-fns";
import cheerio from "cheerio";
import puppeteer from "puppeteer";
import { Channel } from "src/core/channel/channel-models";

const { TWITCH_CLIENT, TWITCH_SECRET } = process.env;

function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time || 1000);
  });
}

export const twitch_api = axios.create({
  baseURL: "https://api.twitch.tv/helix",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
});

export const twitch_oauth_api = axios.create({
  baseURL: "https://id.twitch.tv",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
});

async function getAccessToken(): Promise<string> {
  const test = await twitch_oauth_api.post(
    `/oauth2/token?client_id=${TWITCH_CLIENT}&client_secret=${TWITCH_SECRET}&grant_type=client_credentials`
  );
  const { access_token } = test.data;
  return access_token;
}

async function setAuthentication() {
  if (!twitch_api.defaults.headers.Authorization) {
    twitch_api.defaults.headers.Authorization = `Bearer ${await getAccessToken()}`;
    twitch_api.defaults.headers["client-id"] = TWITCH_CLIENT;
  }
}

export async function getGameFromTwitch(twitch_id: string): Promise<any> {
  await setAuthentication();
  const response = await twitch_api.get(`games?id=${twitch_id}`);
  const { data } = response.data;

  if (data?.length) {
    const [twitchGame] = data;
    return twitchGame;
  }
  return undefined;
}

export async function getGames(name: string): Promise<any> {
  await setAuthentication();
  const response = await twitch_api.get(`games?name=${name}`);
  const { data } = response.data;
  return data;
}

export async function getBroadcaster(
  broadcaster_id: string
): Promise<Channel | undefined> {
  await setAuthentication();
  const url = `channels?broadcaster_id=${broadcaster_id}`;
  console.log(`Trying to get channel with ${url}`);
  const response = await twitch_api.get(url);
  const { data } = response.data;
  if (data && data.length > 0) {
    const [broadcaster] = data;
    return {
      name: broadcaster.broadcaster_name,
      game_id: broadcaster.game_id,
      twitch_id: broadcaster.broadcaster_id,
    } as Channel;
  }
  return undefined;
}

export async function getBroadcasters(
  name: string,
  game_id?: string
): Promise<any[] | undefined> {
  await setAuthentication();
  const url = `search/channels?query=${name}${game_id ? ` ${game_id}` : ""}`;
  console.log(`Trying to get channel with ${url}`);
  const response = await twitch_api.get(url);
  const { data } = response.data;
  console.log(data);
  return data;
}

export async function getClips(
  broadcaster_id: string,
  game_id: string,
  take: number,
  date?: Date
): Promise<any[]> {
  await setAuthentication();
  let query = `game_id=${game_id}`;
  if (broadcaster_id) {
    query = `broadcaster_id=${broadcaster_id}`;
  }
  const url = `clips?${query}&first=${take}${
    date ? `&started_at=${format(date, "yyyy-MM-dd")}T00:00:00Z` : ""
  }`;
  console.log(`Trying to get clips with ${url}`);
  const response = await twitch_api.get(url);
  const { data } = response.data;
  if (data) {
    return data.filter(
      (i: any) =>
        (!i.language || i.language.startsWith("en")) &&
        (!game_id || i.game_id === game_id)
    );
  }
  return [];
}

export async function scrapeDownloadUrl(
  url: string
): Promise<string | undefined> {
  console.log(`Scraping website @ ${url} ...`);
  try {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    console.log("Created new headless page");
    const watchdog1 = page.waitForSelector("video");
    const watchdog = page.waitForFunction(
      () =>
        document.getElementsByTagName("video").length > 0 &&
        (document.getElementsByTagName("video")[0] as any).src,
      { timeout: 30000 }
    );
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await watchdog1;
    await watchdog;
    const html = await page.content();
    console.log("Loaded Html");
    const $ = cheerio.load(html);
    let link;
    // eslint-disable-next-line func-names
    $("video").each(function (this: any) {
      console.log("Successfully read video tag");
      link = $(this).attr("src");
      console.log(`Reading the source = ${link}`);
    });
    return link;
  } catch (err) {
    console.warn(err);
  }
  return undefined;
}
