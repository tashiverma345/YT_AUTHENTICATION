//API idhr alag folder mein create hoti hai
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouter = Router();

// api ka pura naam hojaega : 
//POST : method hojaega
//POST /api/auth/register

authRouter.post("/register",authController.register);

// POST /api/auth/login
authRouter.post("/login",authController.login)

// GET /api/auth/get-me
authRouter.get("/get-me",authController.getMe)

// GET /api/auth/refresh-token
authRouter.get("/refresh-token",authController.refreshToken)

//GET /api/auth/logout
authRouter.get("/logout",authController.logout)

//GET /api/auth/logout-all

authRouter.get("/logout-all",authController.logoutAll)


//GET /api/auth/verify-email

authRouter.get("/verify-email",authController.verifyEmail)

export default authRouter;


//is file mein bus api ko declare krte hain 