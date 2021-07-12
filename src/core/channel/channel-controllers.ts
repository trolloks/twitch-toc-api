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
import { Channel, ChannelDTO } from "./channel-models";
import * as channelCore from "./channel-core";

const tag = tags(["Channels"]);

@prefix("/channel")
export default class ChannelController {
  // List
  @request("get", "")
  @summary("List all channels")
  @tag
  @query({
    game_id: { type: "string", required: false },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "All channels",
      schema: {
        type: "array",
        properties: (Channel as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async listChannels(ctx: any) {
    const channels = await channelCore.listChannels(ctx.query.game_id);
    ctx.response.status = 200;
    ctx.response.body = channels;
  }

  // List
  @request("get", "/fetch")
  @summary("Fetch channel from twitch")
  @tag
  @query({
    name: { type: "string", required: true },
    game_id: { type: "string", required: false },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "All channels",
      schema: {
        type: "array",
        properties: (Channel as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async fetchChannel(ctx: any) {
    const channels = await channelCore.fetchChannels(
      ctx.query.name,
      ctx.query.game_id
    );
    ctx.response.status = 200;
    ctx.response.body = channels;
  }

  // Create
  @request("post", "")
  @summary("Create new channel")
  @tag
  @body({ type: "object", properties: (ChannelDTO as any).swaggerDocument })
  @responses({
    200: {
      description: "Channel Created Successfully",
    },
    400: { description: "error" },
  })
  async createChannel(ctx: any) {
    await channelCore.createChannel(ctx.request.body as ChannelDTO);
    ctx.response.status = 200;
  }

  // Delete
  @request("delete", "")
  @summary("Deletes all channels")
  @tag
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Deleted All channels",
    },
    400: { description: "error" },
  })
  async removeAll(ctx: any) {
    await channelCore.deleteAll();
    ctx.response.status = 200;
  }

  // Delete
  @request("delete", "/{twitch_id}")
  @summary("Deletes all channels")
  @tag
  @path({
    twitch_id: { type: "string", required: true },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "Deleted All channels",
    },
    400: { description: "error" },
  })
  async removeOne(ctx: any) {
    await channelCore.deleteOne(ctx.params.twitch_id);
    ctx.response.status = 200;
  }
}

export function channelController(router: SwaggerRouter) {
  router.map(ChannelController, { doValidation: false });
}
