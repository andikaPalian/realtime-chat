import Message from "../models/message.models";
import Chatroom from "../models/chatroom.models";
import User from "../models/user.models";

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

export {getPrivateChatHistory};