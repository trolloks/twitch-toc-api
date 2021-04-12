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
} from "koa-swagger-decorator-trolloks";
import authMiddleware from "../../server/auth-middleware";
import { Role } from "../auth/auth-types";
import { Game } from "./game-models";
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

  // Create
  @request("post", "")
  @summary("Create new game")
  @tag
  @body({ type: "object", properties: (Game as any).swaggerDocument })
  @responses({
    200: {
      description: "Game Created Successfully",
    },
    400: { description: "error" },
  })
  async createGame(ctx: any) {
    await gameCore.createGame(ctx.request.body as Game);
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
}

export function gameController(router: SwaggerRouter) {
  router.map(GameController, { doValidation: false });
}
