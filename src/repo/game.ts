import { Game } from "../core/game/game-models";
import GameModel, { IGame } from "./models/Game";

function toGame(game: IGame): Game {
  const actualUser: Game = {
    id: game._id,
    name: game.name,
    twitch_id: game.twitch_id,
  };

  console.log(game);
  return actualUser;
}

export async function upsertGame(game: Game): Promise<Game | null> {
  console.log(game);
  const upsertedGame = await GameModel.findOneAndUpdate(
    { name: game.name },
    {
      name: game.name,
      twitch_id: game.twitch_id,
    },
    { upsert: true, new: true }
  );
  return toGame(upsertedGame);
}

export async function getGameById(id: string): Promise<Game | null> {
  const existingGame = await GameModel.findById(id);
  return existingGame && toGame(existingGame);
}

export async function listGames(): Promise<Game[]> {
  const existingGames = await GameModel.find();
  return existingGames.map((existingGame) => toGame(existingGame));
}

export async function removeAll(): Promise<void> {
  await GameModel.deleteMany({});
}
