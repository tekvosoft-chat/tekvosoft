import { Router } from "express";

import multer from "multer";

import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import * as UserController from "../controllers/UserController";
import * as ProfileController from "../controllers/ProfileController";

const userRoutes = Router();

userRoutes.get("/users", isAuth, UserController.index);

userRoutes.get("/users/list", isAuth, UserController.list);

userRoutes.post("/users", isAuth, UserController.store);

// preferência de aparência de quem está logado (cor, modo e fundo)
userRoutes.put("/users/me/theme", isAuth, UserController.updateMyTheme);

// antes de /users/:userId: perfil da própria pessoa
userRoutes.get("/profile/me", isAuth, ProfileController.show);
userRoutes.put("/profile/me", isAuth, ProfileController.update);
userRoutes.put("/users/:userId", isAuth, UserController.update);

userRoutes.get("/users/:userId", isAuth, UserController.show);

userRoutes.put(
  "/users/:userId/profile-image",
  isAuth,
  multer(uploadConfig).single("file"),
  UserController.updateProfileImage
);

userRoutes.delete(
  "/users/:userId/profile-image",
  isAuth,
  UserController.updateProfileImage
);

userRoutes.put("/users/:userId/active", isAuth, UserController.setActive);

userRoutes.delete("/users/:userId", isAuth, UserController.remove);

export default userRoutes;
