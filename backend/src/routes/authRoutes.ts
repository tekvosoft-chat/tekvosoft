import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isAdmin";
import rateLimit from "../middleware/rateLimit";

const authRoutes = Router();

// senha errada: até 10 por e-mail (50 por IP) a cada 15 minutos
authRoutes.post(
  "/login",
  rateLimit({
    name: "login",
    max: 10,
    windowSeconds: 900,
    bodyField: "email",
    onlyFailures: true
  }),
  SessionController.store
);
authRoutes.get(
  "/impersonate/:companyId",
  isAuth,
  isSuper,
  SessionController.impersonate
);
/**
 * @openapi
 * /auth/impersonate/back:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Return from impersonation to super session
 *     description: Restores the original super user from refresh token metadata when the current session is impersonated.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Super session restored
 *       400:
 *         description: Not currently impersonating
 *       401:
 *         description: Unauthorized or expired session
 */
authRoutes.post("/impersonate/back", isAuth, SessionController.backToSuper);
authRoutes.post("/refresh_token", SessionController.update);
authRoutes.delete("/logout", isAuth, SessionController.remove);
authRoutes.get("/me", isAuth, SessionController.me);

export default authRoutes;
