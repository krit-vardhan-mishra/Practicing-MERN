import { app } from "./app";
import { PORT } from "./constants";
import connectDB from "./db/db";

connectDB()
  .then(() => {
    app.listen(PORT || 3000, () => {
      console.log("Server is running on port", PORT || 3000);
    });
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
