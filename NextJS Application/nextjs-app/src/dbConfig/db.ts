import { MONGODB_URI } from "@/helper/constants";
import mongoose from "mongoose";

export async function connect() {
  try {
    await mongoose.connect(MONGODB_URI!);
    const connection = mongoose.connection;

    connection.on('connected', () => {
        console.log("MongoDB connected successfully...!");
    })

    connection.on('error', (error) => {
        console.error("MongoDB connection error: ", error);
        process.exit(1);
    })
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}
