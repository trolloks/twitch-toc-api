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
import { Channel, ChannelDTO } from "./channel-models";
import * as channelCore from "./channel-core";

const tag = tags(["Channels"]);

@prefix("/channel")
export default class ChannelController {
  // List
  @request("get", "")
  @summary("List all channels")
  @tag
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
    const channels = await channelCore.listChannels();
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
}

export function channelController(router: SwaggerRouter) {
  router.map(ChannelController, { doValidation: false });
}
