import express from "express";
import { loginUser, registerUser, uploadAvatar} from "../controllers/user.controller.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import upload from "../../middleware/multer.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.put("/avatar", upload.single("file"), (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({message: err.message});
    } else if (err) {
        return res.status(500).json({message: "Unexpected error during file upload"});
    }
    next();
}, authMiddleware, uploadAvatar);

export default userRouter;