import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

const PORT = process.env.PORT || 8000;
/**
 * Approach 1: define connection in separate file, just call that here.
 */
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Error", error);
    });
    app.listen(PORT, () => {
      console.log("Server is running on PORT", PORT);
    });
  })
  .catch((err) => {
    console.log("Error in connecting MongoDB", err);
  });

/**
 * Approach 2: same file connection approach.
 * 
 * import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
 import express from 'express';
 const app = express();
 
 //we use IIFE to connect with DB, it's an async process.
 ;( async () => {
     try {
         const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
         app.on("error", (error) => {
             console.log('Error', error);
         })
         console.log('Connection Instance', connectionInstance.connection.host);
         app.listen(process.env.PORT, () => {
             console.log('App is listening on port', process.env.PORT);
         })
     } catch (error) {
         console.error('Error', error);
         throw err;
     }
 }) ()

 */
