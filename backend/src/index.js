// require ('dotenv').config({path:'./env'});
import dotenv from 'dotenv'
import express from "express"
import connectDB from "./db/index.js"; 
import mongoose from 'mongoose'; 
import { DB_NAME } from './constants.js';
import { app } from './app.js';
dotenv.config();


connectDB()
.then(()=>{
    const port = process.env.PORT || 8000;

    app.on("error",(err)=>{
        console.log("Error in server setup",err);
        throw err;
    });
    app.listen(port,()=>{
        console.log(`Server is running at port: ${port}`);
    });
})
.catch((err)=>{
    console.log("Mongo Db connection failed!!!",err);
    
}) 
