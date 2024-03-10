import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
});

/**
 * Approach 1: define connection in separate file, just call that here.
 */
connectDB();

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

 