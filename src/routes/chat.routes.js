import express from "express";
import { getPrivateChatHistory } from "../controllers/chat.controller.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const chatRouter = express.Router();

chatRouter.use(authMiddleware);

chatRouter.get("/private", getPrivateChatHistory);

export default chatRouter;