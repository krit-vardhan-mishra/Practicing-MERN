import express from "express";
import dotenv from "dotenv";
import notesRoutes from "./routes/notesRoutes.js";
import { connectDB } from "./config/db.js";
import cors from 'cors';
import path from 'path';
import rateLimiter from "./middleware/rateLimiter.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;
const __dirname = path.resolve();

// if (process.env.NODE_ENV !== "production") {
//     app.use(
//         cors({
//             origin: "http://localhost:5173"
//         })
//     )
// }

// middleware
app.use(
    cors({
        origin: "http://localhost:5173"
    }))

app.use(express.json());
app.use(rateLimiter)

// setting up routes middleware
app.use("/api/notes", notesRoutes)

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`server start on port: ${PORT}`);
    });
});