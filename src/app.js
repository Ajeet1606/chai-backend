import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

//create app using express.
const app = express();

//we setup the middlewares
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};
app.use(cors(corsOptions));

//tell server to accept json data, earlier we had to use body-parser but now express handles it auto.
app.use(express.json({ limit: "16kb" }));
//to get data from urls, we need to do config of urlencoding.
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
//here extended helps us to receive data in nested objects, a complex format.
//static configuration helps us to store some data like img on your server itself (public folder).
app.use(express.static("public"));

//cookie-parser: used to do CRUD on cookies of user in his browser.
app.use(cookieParser());

//routes import

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

//routes declaration
/**
 * app.get method when router and controller defined here.
 * here we have modular approach, controllers and routes are coming from other files, we do app.use, middleware appproach.
 */

//now whenever user goes to /users, it transfers the control to userRouter.
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

//url: http://localhost:8000/api/v1/users/register

export {app}