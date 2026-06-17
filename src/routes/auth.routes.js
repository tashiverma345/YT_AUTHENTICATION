//API idhr alag folder mein create hoti hai
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouter = Router();

// api ka pura naam hojaega : 
//POST : method hojaega
//POST /api/auth/register

authRouter.post("/register",authController.register);

// GET /api/auth/get-me
authRouter.post("/register",authController.getMe)

export default authRouter;

//is file mein bus api ko dclare krte hain 