//is file mein define krenge api , ki api kya kaam kregi

import userModel from "../models/user.model.js";

import crypto from "crypto";

import jwt from "jsonwebtoken";//token bnane ke liye... phle jsonwebtoken install bhi krna hoga,
//npm i jsonwebtoken
import config from "../config/config.js";

import sessionModel from "../models/session.model.js";

import { sendEmail } from "../../services/email.services.js";

import {generateOtp,getOtpHtml} from "../../utils/utils.js";

import otpModel from "../models/otp.model.js";


export async function register(req, res) {

    const { username, email, password } = req.body;

    const isAlreadyRegistered = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    if (isAlreadyRegistered) {
        res.status(409).json({
            message: "Username or email already exist"
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

    const otp=generateOtp();
    const html =getOtpHtml(otp);

    const otpHash =crypto.createHash("sha256").update(otp).digest("hex");
    await otpModel.create({
        email,
        user:user._id,
        otpHash
    })

  

    await sendEmail(email,"OTP Verification", `Your OTP code is ${otp}`,html)

    // //token creation
    // // const token = jwt.sign({
    // //     id:user._id //jo id humein database se mili usko token mein store kra denge
    // // },config.JWT_SECRET,
    // //    {
    // //     expiresIn:"1d" //1 day
    // //    }
    // // )


// jab otp based auth karwa rhe tab commment out krdiye ye sab function

    // const refreshToken = jwt.sign({
    //     id: user._id
    // }, config.JWT_SECRET,
    //     {
    //         expiresIn: "7d"
    //     }
    // )
    // //refresh token ko cookie mein store krte or uske liye package install krna hoga : npm i cookie-parser

    // //phle refreshToken ko create krte phir access token ko generate kr rhe hote hain

    // const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // const session = await sessionModel.create({
    //     user: user._id,
    //     refreshTokenHash,
    //     ip: req.ip,
    //     userAgent: req.headers["user-agent"]
    // })

    // const accessToken = jwt.sign({
    //     id: user._id,
    //     sessionId: session._id
    // }, config.JWT_SECRET,
    //     {
    //         expiresIn: "15m"
    //     }
    // )





    // res.cookie("refreshToken", refreshToken, {
    //     httpOnly: true,//iska mtlb ye h ki: client site wali js cookies mein store token ko read nhi kr paegi
    //     secure: true,
    //     sameSite: "strict",
    //     maxAge: 7 * 24 * 60 * 60 * 1000 //7 days baad cookie jo store kiya hoga vho apne aap ht jaega
    // })

    res.status(201).json({
        message: "User registered successfully",
        user: {
            username: user.username,
            email: user.email,
            verified:user.verified
        },
         // (otp wale mein access token nhi jaega )accessToken, //ye token memory mein store hota tho bhejna jruri hota response mein
    })
}

export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    if(!user.verified){
        return res.status(401).json({
            message:"Email not verified"
        })
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const isPasswordValid = hashedPassword === user.password;

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    )

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    })

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id
    }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        })

    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure: true,
        sameSite : "Strict",
        maxAge:7*24*60*60*1000
    })

    res.status(200).json({
        message:"Logged in Successfully",
        user:{
            username:user.username,
            email :user.email,
        },accessToken,
    }) 
}

export async function getMe(req, res) {
    const token = req.headers.authorization?.split(" ")[1]; // see screenshot 1 (1.png)
    //token ko hum bhejenge in bearer with space so isliye ese format mein likha hai .

    if (!token) {
        return res.status(401).json({
            message: "token not found"
        })
    }

    //to read the toke :
    const decoded = jwt.verify(token, config.JWT_SECRET)
    //use config.JWT_SECRET to read the details

    // console.log(decoded)

    const user = await userModel.findById(decoded.id)

    res.status(200).json({
        message: "user fetched successfully",
        user: {
            username: user.username,
            email: user.email,
        }
    })
}

export async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found"
        })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)


    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })

    if (!session) {
        return res.status(401).json({
            message: "Invalid refresh token"
        })
    }

    const accessToken = jwt.sign({
        id: decoded.id

    }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    )


    const newRefreshToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    )
    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.status(200).json({
        message: "Access token refreshed successfully",
        accessToken
    })
}

export async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({
            message: "Refresh token not found"
        })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })

    if (!session) {
        return res.status(400).json({
            message: "Invalid refresh token"
        })
    }

    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "Logged out Successfully"
    })
}

export async function logoutAll(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({
            message: "Refresh token not found"
        })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

    await sessionModel.updateMany({
        user: decoded.id,
        revoked: false
    }, {
        revoked: true
    })

    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "Logged out from all devices successfully"
    })
}

export async function verifyEmail(req,res){
    const {otp,email} = req.body
    const otpHash=crypto.createHash("sha256").update(otp).digest("hex");
    
    const otpDoc = await otpModel.findOne({
        email,
        otpHash
    })

    if(!otpDoc){
        return res.status(400).json({
            message : "Invalid OTP"
        })
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user,{
        verified : true
    })

    await otpModel.deleteMany({
        user: otpDoc.user
    })

    return res.status(200).json({
        message:"Email verified successfully",
        user:{
            username:user.username,
            email:user.email,
            verified: user.verified
        }
    })

}

//access token : to access any feature on server - expires in 15 min
//refresh token : to generate new access token - expire in 7 to 15 days


//agr humne nhi batya hai db mein (cluster se connect krte time) kisse connect krna tho bydefault vho test se connect krdeta hai
//jab MONGO_URI mein main-auth likhdia tho ab cluster mein db ko main-auth se connect krega


//refreshToken banane ke time par hum ek session bhi create krte or us session mein hum hash pass kr rhe hote hain