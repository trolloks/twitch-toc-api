import { SwaggerRouter } from "koa-swagger-decorator-trolloks";
import { userController } from "../core/user/user-controllers";
import { authController } from "../core/auth/auth-controllers";
import { gameController } from "../core/game/game-controllers";
import { channelController } from "../core/channel/channel-controllers";
import { clipController } from "../core/clip/clip-controllers";
import { videoController } from "../core/video/video-controllers";

export function configureControllers(router: SwaggerRouter) {
  userController(router);
  authController(router);
  gameController(router);
  channelController(router);
  clipController(router);
  videoController(router);
}
