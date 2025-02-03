import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDb from "./src/config/db.js";
import userRouter from "./src/routes/user.routes.js";
import connectCloudinary from "./src/config/cloudinary.js";

const app = express();
const port = process.env.PORT;
connectDb();
connectCloudinary();

app.use(cors());
app.use(express.json());

app.use("/api/user", userRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});