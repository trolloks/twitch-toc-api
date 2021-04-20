import { swaggerClass, swaggerProperty } from "koa-swagger-decorator-trolloks";

@swaggerClass()
export class Channel {
  id?: string;
  name: string;
  game_id?: string;
  twitch_id?: string;
}

@swaggerClass()
export class ChannelDTO {
  @swaggerProperty({ type: "string", required: false })
  broadcaster_id: string;
}
