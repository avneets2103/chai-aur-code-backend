import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export async function dbConnect(){
    try {
        const response = await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);
        console.log('Success');
        console.log(response.connection.host);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
