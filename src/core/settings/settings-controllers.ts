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
import { Settings } from "./settings-models";
import * as settingsCore from "../settings/settings-core";

const tag = tags(["Settings"]);

@prefix("/settings")
export default class SettingsController {
  // List
  @request("get", "")
  @summary("List all settings")
  @tag
  @query({
    user_id: { type: "string", required: true },
  })
  @middlewares([authMiddleware({ minRoles: [Role.SUPERUSER] })])
  @responses({
    200: {
      description: "All settings",
      schema: {
        type: "array",
        properties: (Settings as any).swaggerDocument,
      },
    },
    400: { description: "error" },
  })
  async listSettings(ctx: any) {
    const channels = await settingsCore.listSettings(ctx.query.user_id);
    ctx.response.status = 200;
    ctx.response.body = channels;
  }

  // Create
  @request("post", "")
  @summary("Create new settings")
  @tag
  @body({ type: "object", properties: (Settings as any).swaggerDocument })
  @responses({
    200: {
      description: "Settings Created Successfully",
    },
    400: { description: "error" },
  })
  async upsertSettings(ctx: any) {
    await settingsCore.upsertSettings(ctx.request.body as Settings);
    ctx.response.status = 200;
  }
}

export function settingsController(router: SwaggerRouter) {
  router.map(SettingsController, { doValidation: false });
}
