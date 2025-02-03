import jwt from "jsonwebtoken";
import User from "../src/models/user.models.js";

const authMiddleware = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.Authorization || req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer")) {
            token = authHeader.split(" ")[1];
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    return res.status(403).json({
                        message: "User is not authorized"
                    });
                }

                const user = await User.findById(decoded.user?.id || decoded.id);
                if (!user) {
                    return res.status(404).json({
                        message: "User not found"
                    });
                }

                req.user = {
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                }

                next();
            });
        } else {
            return res.status(403).json({
                message: "Token is missing or not provided"
            });
        }
    } catch (error) {
        console.error("Error authenticating user:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export default authMiddleware;