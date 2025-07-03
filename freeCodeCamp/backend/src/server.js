import express from "express";
import dotenv from "dotenv";
import notesRoutes from "./routes/notesRoutes.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
connectDB();
const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use("/api/notes", notesRoutes)

app.listen(PORT, () => {
    console.log(`server start on port: ${PORT}`);
});