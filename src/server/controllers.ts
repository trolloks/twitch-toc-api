import { SwaggerRouter } from "koa-swagger-decorator-trolloks";
import { userController } from "../core/user/user-controllers";
import { authController } from "../core/auth/auth-controllers";
import { gameController } from "../core/game/game-controllers";

export function configureControllers(router: SwaggerRouter) {
  userController(router);
  authController(router);
  gameController(router);
}
