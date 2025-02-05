import Message from "../models/message.models.js";
import Chatroom from "../models/chatroom.models.js";
import User from "../models/user.models.js";

const getPrivateChatHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {withUserId, page = 1, limit = 20} = req.query;

        if (!withUserId) {
            return res.status(400).json({
                message: "With user id is required"
            });
        }

        const messages = await Message.find({
            messageType: "private",
            $or: [
                {sender: userId, receiver: withUserId},
                {sender: withUserId, receiver: userId}
            ]
        }).sort({createdAt: -1}).skip((parseInt(page) - 1) * parseInt(limit)).populate("sender", "username avatar").populate("receiver", "username avatar");
        res.status(200).json({
            message: messages.reverse()
        });
    } catch (error) {
        console.error("Error during getting private chat history:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const createChatRoom = async (req, res) => {
    try {
        const {name, participants} = req.body;
        if (!name?.trim() || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({
                message: "Room name and participants are required"
            });
        }

        const room = new Chatroom({
            name: name.trim(),
            participants
        });
        await room.save();
        res.status(200).json({
            message: "Room chat created successfully",
            room: room
        });
    } catch (error) {
        console.error("Error during creating room chat:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const getChatRoomHistory = async (req, res) => {
    try {
        const roomId = req.params;
        const room = await Chatroom.findById(roomId).populate({
            path: "messages",
            options: {
                sort: {createdAt: -1}
            },
            populate: {
                path: "sender",
                select: "username avatar",
            }
        }).populate("participants", "username avatar status");
        if (!room) {
            return res.status(404).json({
                message: "Room chat not found"
            });
        }

        res.status(200).json({
            room: room
        });
    } catch (error) {
        console.error("Error during getting room chat history:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const addMessageToRoom = async (req, res) => {
    try {
        const roomId = req.params;
        const {sender, message, contentType = "text"} = req.body;
        if (!roomId || !sender || !message) {
            return res.status(400).json({
                message: "Incomplete data"
            });
        }

        // Buat pesan baru untuk room
        const newMessage = new Message({
            sender,
            chatRoom: roomId,
            message: message.trim(),
            messageType: "room",
            contentType
        });
        await newMessage.save();
        await newMessage.populate("sender", "username avatar");

        // Update room chat: tambahkan pesan dan update lastMessage
        await Chatroom.findByIdAndUpdate(roomId, {
            $push: {messages: newMessage._id},
            $set: {lastMessage: newMessage._id},
        });

        res.status(201).json({
            message: "Message sent successfully",
            message: newMessage,
        });
    } catch (error) {
        console.error("Error during sending message:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const getUserChatRoom = async (req, res) => {
    try {
        const userId = req.user.userId;
        const rooms = await Chatroom.find({participants: userId}).populate("participants", "username avatar status").sort({updatedAt: -1});
        res.status(200).json({
            rooms: rooms
        });
    } catch (error) {
        console.error("Error during getting user chat rooms:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const sendPrivateMessage = async (req, res) => {
    try {
        const {sender, receiver, message, contentType = "text"} = req.body;
        if (!sender || !receiver || !message) {
            return res.status(400).json({
                message: "Incomplete data"
            });
        }

        const newMessage = new Message({
            sender,
            receiver,
            message: message.trim(),
            messageType: "private",
            contentType,
            status: "sent"
        });
        await newMessage.save();
        await newMessage.populate([
            {path: "sender", select: "username avatar"},
            {path: "receiver", select: "username avatar"},
        ]);

        res.status(201).json({
            message: "Message sent successfully",
            message: newMessage,
        });
    } catch (error) {
        console.error("Error during sending private message:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {getPrivateChatHistory, createChatRoom, getChatRoomHistory, addMessageToRoom, getUserChatRoom, sendPrivateMessage};