import { swaggerClass, swaggerProperty } from "koa-swagger-decorator-trolloks";

@swaggerClass()
export class Game {
  id?: string;

  @swaggerProperty({ type: "string", required: true })
  name: string;

  @swaggerProperty({ type: "string", required: false })
  twitch_id?: string;
}
