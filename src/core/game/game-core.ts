import { Game, GameDTO } from "./game-models";
import * as gameRepo from "../../repo/game";
import { getGameId } from "../../gateway/twitch-gateway";

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

export async function createGame(gameDTO: GameDTO): Promise<void> {
  const game: Game = { ...gameDTO };
  const id = await getGameId(game.name);
  if (!id) {
    return;
  }
  game.twitch_id = id;
  await gameRepo.upsertGame(game);
}

export async function deleteAll(): Promise<void> {
  await gameRepo.removeAll();
}
