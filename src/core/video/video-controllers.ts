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
import { Video } from "./video-models";
import * as videoCore from "../video/video-core";

const tag = tags(["Videos"]);

@prefix("/video")
export default class VideoController {
  // List
  @request("get", "")
  @summary("List all videos")
  @tag
  @query({
    game_id: { type: "string", required: false },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "All videos",
      schema: {
        type: "array",
        properties: (Video as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async listVideos(ctx: any) {
    const channels = await videoCore.listVideos(ctx.query.game_id);
    ctx.response.status = 200;
    ctx.response.body = channels;
  }

  @request("get", "/{id}")
  @summary("Get specific video")
  @tag
  @path({
    id: { type: "string", required: true },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Get specific video",
      schema: {
        type: "object",
        properties: (Video as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async getClip(ctx: any) {
    const clips = await videoCore.getVideo(ctx.params.id);
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  // Delete
  @request("delete", "")
  @summary("Deletes all clips")
  @tag
  @query({
    game_id: { type: "string", required: false },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Deleted All clips",
    },
    400: { description: "error" },
  })
  async removeAll(ctx: any) {
    await videoCore.deleteAllVideos(ctx.query.game_id);
    ctx.response.status = 200;
  }
}

export function videoController(router: SwaggerRouter) {
  router.map(VideoController, { doValidation: false });
}
