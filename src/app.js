import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// cors configure
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

// data khi jgah se aaega to uske lie settings lgti hai
// unko parse krne k lie
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({limit: "16kb"}));
app.use(express.static("public"))
app.use(cookieParser());

// routes import 
import { UserRouter } from "./routes/user.routes.js";

// routes
app.use('/api/v1/users', UserRouter);

export {app};