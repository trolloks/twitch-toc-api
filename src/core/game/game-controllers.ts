import {
  SwaggerRouter,
  request,
  summary,
  prefix,
  tags,
  responses,
  middlewares,
  query,
  body,
  path,
} from "koa-swagger-decorator-trolloks";
import authMiddleware from "../../server/auth-middleware";
import { Role } from "../auth/auth-types";
import { Game, GameDTO } from "./game-models";
import * as gameCore from "./game-core";

const tag = tags(["Games"]);

@prefix("/game")
export default class GameController {
  // List
  @request("get", "")
  @summary("List all games")
  @tag
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "All games",
      schema: {
        type: "array",
        properties: (Game as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async listGames(ctx: any) {
    const games = await gameCore.listGames();
    ctx.response.status = 200;
    ctx.response.body = games;
  }

  // List
  @request("get", "/fetch/twitch")
  @summary("Fetch from twitch")
  @tag
  @query({
    name: { type: "string", required: true },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Fetch from twitch",
      schema: {
        type: "array",
        properties: (Game as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async fetchGames(ctx: any) {
    const games = await gameCore.fetchGames(ctx.query.name);
    ctx.response.status = 200;
    ctx.response.body = games;
  }

  @request("get", "/{twitch_id}")
  @summary("Get specific game")
  @tag
  @path({
    twitch_id: { type: "string", required: true },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Get specific game",
      schema: {
        type: "object",
        properties: (Game as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async getClip(ctx: any) {
    const clips = await gameCore.getGame(ctx.params.twitch_id);
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  // Create
  @request("post", "")
  @summary("Create new game")
  @tag
  @body({ type: "object", properties: (GameDTO as any).swaggerDocument })
  @responses({
    200: {
      description: "Game Created Successfully",
    },
    400: { description: "error" },
  })
  async createGame(ctx: any) {
    await gameCore.createGame(ctx.request.body as GameDTO);
    ctx.response.status = 200;
  }

  // Delete
  @request("delete", "")
  @summary("Deletes all games")
  @tag
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Deleted All games",
    },
    400: { description: "error" },
  })
  async listUsers(ctx: any) {
    await gameCore.deleteAll();
    ctx.response.status = 200;
  }

  // Delete
  @request("delete", "/{twitch_id}")
  @path({
    twitch_id: { type: "string", required: true },
  })
  @summary("Deletes specific games")
  @tag
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Deleted specific games",
    },
    400: { description: "error" },
  })
  async deleteGame(ctx: any) {
    await gameCore.deleteOne(ctx.params.twitch_id);
    ctx.response.status = 200;
  }
}

export function gameController(router: SwaggerRouter) {
  router.map(GameController, { doValidation: false });
}
