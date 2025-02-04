import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    avatar: {
        type: String,
        default: "",
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    cloudinary_id: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["online", "offline"],
        default: "offline",
    }
}, {
    timestamps: true,
});

const User = mongoose.model("User", userSchema);

export default User;