import mongoose from "mongoose";
import { DB_URL, DB_NAME } from "../constants";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${DB_URL}/${DB_NAME}`);
        console.log(`\nMongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error: any) {
        console.log("Database connection failed:", error.message);
        process.exit(1);
    }
}

export default connectDB;