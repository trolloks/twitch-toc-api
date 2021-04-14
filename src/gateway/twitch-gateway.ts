import axios from "axios";
import { format } from "date-fns";
import cheerio from "cheerio";
import puppeteer from "puppeteer";
import { TWITCH_CLIENT, TWITCH_SECRET } from "../env.json";

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

export async function getGameId(name: string): Promise<string | undefined> {
  await setAuthentication();
  const response = await twitch_api.get(`games?name=${name}`);
  const { data } = response.data;

  if (data?.length) {
    const [twitchGame] = data;
    if (twitchGame) {
      return twitchGame.id;
    }
  }
  return undefined;
}

export async function getBroadcasterId(
  name: string
): Promise<string | undefined> {
  await setAuthentication();
  const response = await twitch_api.get(`search/channels?query=${name}`);
  const { data } = response.data;

  if (data?.length) {
    const [twitchUser] = data;
    if (twitchUser) {
      return twitchUser.id;
    }
  }
  return undefined;
}

export async function getClips(
  broadcaster_id: string,
  game_id: string,
  take: number
): Promise<any[]> {
  await setAuthentication();
  let query = `game_id=${game_id}`;
  if (broadcaster_id) {
    query = `broadcaster_id=${broadcaster_id}`;
  }
  const url = `clips?${query}&first=${take}&started_at=${format(
    new Date(),
    "yyyy-MM-dd"
  )}T00:00:00Z`;
  console.log(`Trying to get clips with ${url}`);
  const response = await twitch_api.get(url);
  const { data } = response.data;
  if (data) {
    return data.filter((i: any) => i.language === "en");
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
    const waitForSelector = page.waitForSelector("video");
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await waitForSelector;
    await page.waitForFunction(
      'document.getElementsByTagName("video")[0].src != ""'
    );
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
