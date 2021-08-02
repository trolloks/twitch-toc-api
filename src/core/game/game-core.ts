import { Game, GameDTO } from "./game-models";
import * as gameRepo from "../../repo/game";
import { getGameFromTwitch, getGames } from "../../gateway/twitch-gateway";

const { NODE_SECRET } = process.env;

export async function listGames(): Promise<Game[]> {
  const dataUsers = await gameRepo.listGames();
  if (dataUsers) {
    return dataUsers;
  }
  return [];
}
export async function getGame(twitch_id: string): Promise<Game | null> {
  return await gameRepo.getGameByTwitchId(twitch_id);
}

export async function fetchGames(search: string) {
  return await getGames(search);
}

export async function createGame(gameDTO: GameDTO): Promise<void> {
  const { twitch_id } = gameDTO;
  const gameFromTwitch = await getGameFromTwitch(twitch_id);
  if (!gameFromTwitch) {
    return;
  }
  await gameRepo.upsertGame({
    ...gameFromTwitch,
    twitch_id,
  });
}

export async function deleteAll(): Promise<void> {
  await gameRepo.removeAll();
}

export async function deleteOne(twitch_id: string): Promise<void> {
  await gameRepo.removeOne(twitch_id);
}
