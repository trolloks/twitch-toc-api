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
import * as clipCore from "./clip-core";
import { Clip } from "./clip-models";

const tag = tags(["Clips"]);

@prefix("/clip")
export default class ClipController {
  // List
  @request("get", "")
  @summary("List all clips")
  @tag
  @query({
    broadcast_id: { type: "string", required: false },
    game_id: { type: "string", required: false },
    take: { type: "numbre", required: false },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "All clips",
      schema: {
        type: "array",
        properties: (Clip as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async listClips(ctx: any) {
    const clips = await clipCore.listClips(
      ctx.query.broadcast_id,
      ctx.query.game_id,
      ctx.query.take
    );
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  // List
  @request("post", "testdownload")
  @summary("Test Download")
  @tag
  @query({
    broadcast_id: { type: "string", required: false },
    game_id: { type: "string", required: false },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "All clips",
      schema: {
        type: "array",
        properties: (Clip as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async testDownload(ctx: any) {
    const clips = await clipCore.testDownload(
      ctx.query.broadcast_id,
      ctx.query.game_id
    );
    ctx.response.status = 200;
    ctx.response.body = clips;
  }
}

export function clipController(router: SwaggerRouter) {
  router.map(ClipController, { doValidation: false });
}
