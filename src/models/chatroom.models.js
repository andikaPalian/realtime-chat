import mongoose from "mongoose";

const chatroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    }
}, {
    timestamps: true,
});

const Chatroom = mongoose.model("Chatroom", chatroomSchema);

export default Chatroom;