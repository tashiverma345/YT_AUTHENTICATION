//to create server or uski configuration likhenge ismein ki request.body ka data hmare pass aa sake.

import express from 'express';
import morgan from 'morgan'; 
import authRouter from './routes/auth.routes.js';

const app = express() // for calling express

app.use(express.json()); //middleware
app.use(morgan('dev')); //logger : application me kya ho raha hai uska record rakhta hai , dev iska ek mode hai ..or bhi modes hote hain.
//npm i morgan


app.use("/api/auth",authRouter);///api/auth ye prefix hain unsaari api ke liye jo authRouter ki help se create krenge

export default app;