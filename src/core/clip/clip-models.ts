import { swaggerClass, swaggerProperty } from "koa-swagger-decorator-trolloks";

@swaggerClass()
export class Clip {
  twitch_id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  broadcaster_name: string;
  view_count: string;
  language: string;
}
