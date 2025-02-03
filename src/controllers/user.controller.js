import User from "../models/user.models.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {
    try {
        const {username, email, password} = req.body;
        if (!username.trim() || !email.trim() || !password.trim()) {
            return res.status(400).json({
                message: "Please fill all the fields"
            });
        }

        if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 30) {
            return res.status(400).json({
                message: "Username must be between 3 and 30 characters"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Please enter a valid email"
            });
        }

        const passwordReqex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordReqex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: "User created successfully",
            user: userResponse,
        })
    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email.trim() || !password.trim()) {
            return res.status(400).json({
                message: "Please fill all the fields"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Please enter a valid email"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({
                id: user._id,
            }, process.env.JWT_SECRET, {expiresIn: "1d"});
            user.password = undefined;
            return res.status(200).json({
                message: "User logged in successfully",
                token,
                user: user
            });
        } else {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
    } catch (error) {
        console.log("Error during login:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {registerUser, loginUser};