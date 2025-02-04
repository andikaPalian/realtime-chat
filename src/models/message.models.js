import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chatroom",
    },
    message: {
        type: String,
        required: true,
    },
    messageType: {
        type: String,
        enum: ["private", "room"],
        default: "private",
    },
    contentType: {
        type: String,
        enum: ["text", "image", "file"],
        default: "text",
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent"
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

const Message = mongoose.model("Message", messageSchema);

export default Message;