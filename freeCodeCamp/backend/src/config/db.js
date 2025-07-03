import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config()
const CONNECTION_URL = process.env.CONNECTION_URL;

export const connectDB = async () => {
    try {
        await mongoose.connect(CONNECTION_URL)
        console.log("MongoDB connected successfully...!");
    } catch (err) {
        console.error("Error connecting to mongodb", err);
        process.exit(1);
    }
}