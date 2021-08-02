import { swaggerClass, swaggerProperty } from "koa-swagger-decorator-trolloks";

@swaggerClass()
export class Game {
  id?: string;
  name: string;
  twitch_id?: string;
  box_art_url?: string;
}

@swaggerClass()
export class GameDTO {
  @swaggerProperty({ type: "string", required: true })
  name: string;
}
