import { Game } from "./game-models";
import * as gameRepo from "../../repo/game";

const { NODE_SECRET } = process.env;

export async function listGames(): Promise<Game[]> {
  const dataUsers = await gameRepo.listGames();
  if (dataUsers) {
    return dataUsers;
  }
  return [];
}

export async function createGame(game: Game): Promise<void> {
  await gameRepo.upsertGame(game);
}

export async function deleteAll(): Promise<void> {
  await gameRepo.removeAll();
}
