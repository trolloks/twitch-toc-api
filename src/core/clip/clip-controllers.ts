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
    //broadcast_id: { type: "string", required: false },
    //game_id: { type: "string", required: false },
    //take: { type: "numbre", required: false },
    download_status: { type: "string", required: false },
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
      //ctx.query.broadcast_id,
      //ctx.query.game_id,
      //ctx.query.take
      ctx.query.download_status
    );
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  @request("post", "/create_for_day")
  @summary("Create clips for the day")
  @tag
  @query({
    broadcast_id: { type: "string", required: false },
    game_id: { type: "string", required: false },
    take: { type: "number", required: false },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Created clips",
      schema: {
        type: "array",
        properties: (Clip as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async createForDay(ctx: any) {
    await clipCore.createClipsForTheDay(
      ctx.query.broadcast_id,
      ctx.query.game_id,
      ctx.query.take
    );
    ctx.response.status = 200;
  }

  @request("post", "/trigger_download")
  @summary("Trigger downloads on all waiting clips")
  @tag
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
  async triggerDownload(ctx: any) {
    const clips = await clipCore.triggerDownload();
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  @request("post", "/process")
  @summary("Process all downloaded clips")
  @tag
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
  async processClips(ctx: any) {
    const clips = await clipCore.processDownloads();
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  // Delete
  @request("delete", "")
  @summary("Deletes all clips")
  @tag
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Deleted All clips",
    },
    400: { description: "error" },
  })
  async removeAll(ctx: any) {
    await clipCore.deleteAll();
    ctx.response.status = 200;
  }
}

export function clipController(router: SwaggerRouter) {
  router.map(ClipController, { doValidation: false });
}
