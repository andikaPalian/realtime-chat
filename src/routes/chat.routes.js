import express from "express";
import { addMessageToRoom, createChatRoom, getChatRoomHistory, getPrivateChatHistory, getUserChatRoom, sendPrivateMessage } from "../controllers/chat.controller.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const chatRouter = express.Router();

chatRouter.use(authMiddleware);

// Private Chat
chatRouter.get("/private", getPrivateChatHistory);
chatRouter.post('/privete/messages', sendPrivateMessage);

// Room Chat
chatRouter.post("/room", createChatRoom);
chatRouter.get("/room/:roomId", getChatRoomHistory);
chatRouter.post("/room/:roomId/messages", addMessageToRoom);
chatRouter.get("/rooms", getUserChatRoom);

export default chatRouter;