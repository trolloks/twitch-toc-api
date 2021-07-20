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
    game_id: { type: "string", required: false },
    //take: { type: "numbre", required: false },
    download_status: { type: "string", required: false },
    tag: { type: "string", required: false },
    video_id: { type: "string", required: false },
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
      ctx.query.game_id,
      //ctx.query.take
      ctx.query.download_status,
      ctx.query.tag,
      ctx.query.video_id
    );
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  @request("get", "/{id}")
  @summary("Get specific clip")
  @tag
  @path({
    id: { type: "string", required: true },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Get specific clips",
      schema: {
        type: "object",
        properties: (Clip as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async getClip(ctx: any) {
    const clips = await clipCore.getClip(ctx.params.id);
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  @request("post", "/status")
  @summary("Change clip status")
  @tag
  @query({
    fromState: { type: "string", required: true },
    toState: { type: "string", required: true },
    twitch_id: { type: "string", required: false },
    game_id: { type: "string", required: false },
    tag: { type: "string", required: false },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Reject clip",
      schema: {
        type: "array",
        properties: (Clip as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async reject(ctx: any) {
    await clipCore.setState(
      ctx.query.fromState,
      ctx.query.toState,
      ctx.query.twitch_id,
      ctx.query.game_id,
      ctx.query.tag
    );
    ctx.response.status = 200;
  }

  @request("post", "/fetch")
  @summary("Fetch clips")
  @tag
  @query({
    broadcast_id: { type: "string", required: false },
    game_id: { type: "string", required: false },
    start_date: { type: "string", required: false },
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
      ctx.query.start_date,
      ctx.query.take
    );
    ctx.response.status = 200;
  }

  @request("post", "/trigger_download")
  @summary("Trigger downloads on all waiting clips")
  @query({
    game_id: { type: "string", required: false },
  })
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
    const clips = await clipCore.triggerDownload(ctx.query.game_id);
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  @request("post", "/{id}/tag")
  @summary("Add Tag to clip")
  @path({
    id: { type: "string", required: true },
  })
  @query({
    tags: { type: "array", items: { type: "string" } },
  })
  @tag
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Add Tag to clip",
      schema: {
        type: "array",
        properties: (Clip as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async addTagToClip(ctx: any) {
    const clips = await clipCore.addTagToClip(
      ctx.params.id,
      ctx.query.tags ? ctx.query.tags.split(",") : []
    );
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  @request("post", "/trigger_download/{id}")
  @summary("Trigger downloads on specific clip")
  @tag
  @path({
    id: { type: "string", required: true },
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
  async triggerSpecificDownload(ctx: any) {
    const clips = await clipCore.triggerSpecificDownload(ctx.params.id);
    ctx.response.status = 200;
    ctx.response.body = clips;
  }

  @request("post", "/process")
  @summary("Process all downloaded clips")
  @tag
  @query({
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
  async processClips(ctx: any) {
    const clips = await clipCore.processDownloads(ctx.query.game_id);
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
    await clipCore.deleteAll(ctx.query.game_id);
    ctx.response.status = 200;
  }
}

export function clipController(router: SwaggerRouter) {
  router.map(ClipController, { doValidation: false });
}
