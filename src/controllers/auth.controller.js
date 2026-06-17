//is file mein define krenge api , ki api kya kaam kregi

import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";//token bnane ke liye... phle jsonwebtoken install bhi krna hoga,
//npm i jsonwebtoken
import config from "../config/config.js";

export async function register(req,res){

    const{ username,email,password}=req.body;

    const isAlreadyRegistered= await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(isAlreadyRegistered){
        res.status(409).json({
            message:"Username or email already exist"
        })
    }

    const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

    const user = await userModel.create({
        
        username,
        email,
        password: hashedPassword
    })

    const token = jwt.sign({
        id:user._id //jo id humein database se mili usko token mein store kra denge
    },config.JWT_SECRET,
       {
        expiresIn:"1d" //1 day
       }
    )

    res.status(201).json({
        message:"User registered successfully",
        user:{
            username:user.username,
            email: user.email,
        },token 
    })
}