import { swaggerClass, swaggerProperty } from "koa-swagger-decorator-trolloks";

@swaggerClass()
export class Video {
  id?: string;
  game_id?: string;
  download_path?: string;
  duration?: number;
  tags?: string[];
}
