import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

//create app using express.
export const app = express();

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
