import dotenv from "dotenv";

dotenv.config();
// bina iske .env file ke variables ko access nhi kr paenge

if(!process.env.MONGO_URI){
    throw new Error("MONGO_URI is not defined in environment variables");
    //agr .env file mein required environmental variable exist nhi krenge tho server start nhi hoga
}
if(!process.env.JWT_SECRET){
    throw new Error("JWT SECRET is not defined in environment variables");
}
const config={
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET
}

export default config;