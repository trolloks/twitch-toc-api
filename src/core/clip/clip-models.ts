import { swaggerClass, swaggerProperty } from "koa-swagger-decorator-trolloks";

@swaggerClass()
export class Clip {
  id?: string;
  twitch_id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  broadcaster_name: string;
  broadcaster_id: string;
  view_count: string;
  language: string;
  download_status: string;
}
