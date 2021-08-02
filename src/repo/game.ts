import { Game } from "../core/game/game-models";
import GameModel, { IGame } from "./models/Game";

function toGame(game: IGame): Game {
  const actualUser: Game = {
    id: game._id,
    name: game.name,
    twitch_id: game.twitch_id,
    box_art_url: game.box_art_url,
  };
  return actualUser;
}

export async function upsertGame(game: Game): Promise<Game | null> {
  const upsertGame = await GameModel.findOneAndUpdate(
    { twitch_id: game.twitch_id },
    {
      ...game,
    },
    { upsert: true, new: true }
  );

  return toGame(upsertGame);
}

export async function getGameById(id: string): Promise<Game | null> {
  const existingGame = await GameModel.findById(id);
  return existingGame && toGame(existingGame);
}

export async function getGameByTwitchId(
  twitch_id: string
): Promise<Game | null> {
  const existingGame = await GameModel.findOne({ twitch_id });
  return existingGame && toGame(existingGame);
}

export async function listGames(): Promise<Game[]> {
  const existingGames = await GameModel.find();
  return existingGames.map((existingGame) => toGame(existingGame));
}

export async function removeAll(): Promise<void> {
  await GameModel.deleteMany({});
}

export async function removeOne(twitch_id: string): Promise<void> {
  await GameModel.deleteOne({ twitch_id });
}
