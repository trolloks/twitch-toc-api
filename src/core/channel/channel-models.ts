import { swaggerClass, swaggerProperty } from "koa-swagger-decorator-trolloks";

@swaggerClass()
export class Channel {
  id?: string;
  name: string;
  twitch_id?: string;
}

@swaggerClass()
export class ChannelDTO {
  @swaggerProperty({ type: "string", required: true })
  name: string;
}
