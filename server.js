import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDb from "./src/config/db.js";
import userRouter from "./src/routes/user.routes.js";
import connectCloudinary from "./src/config/cloudinary.js";
import { Server } from "socket.io";
import http from "http";
import handleSocketConnection from "./src/sockets/chatSockets.js";

const app = express();
const port = process.env.PORT;
connectDb();
connectCloudinary();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
// Tangani koneksi Socket.io.
// Setiap kali ada koneksi baru, fungsi handleSocketConnection dipanggil dengan objek socket dan instance io.
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    handleSocketConnection(socket, io);

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    })
})

app.use(cors());
app.use(express.json());

app.use("/api/user", userRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});