import { swaggerClass } from "koa-swagger-decorator-trolloks";

@swaggerClass()
export class Settings {
  id?: string;
  name?: string;
  user_id: string;
  font_path?: string;
  banner_path?: string;
  gif_path?: string;
  intro_path?: string;
  outro_path?: string;
}
