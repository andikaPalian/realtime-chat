import Message from "../models/message.models.js";
import Chatroom from "../models/chatroom.models.js";
import User from "../models/user.models.js";

/**
 * Handles the connection of a client socket.
 * 
 * @param {Socket} socket - The socket instance for the connected client.
 * @param {Server} io - The Socket.io server instance.
 */

const handleSocketConnection = async (socket, io) => {
    if (!socket.auth || socket.userId) {
        socket.disconnect(true);
        return;
    }
    console.log(`[SOCKET] Client connected: ${socket.id} (User: ${socket.userId})`);

    io.userSockets = io.userSockets || new Map();
    io.userSockets.set(socket.userId, socket.id);

    // Broadcast user online status
    socket.broadcast.emit("userOnline", {userId: socket.userId});

    // Join ke personal room user untuk private chat
    socket.join(`user: ${socket.userId}`);

    // Menyimpan active room untuk socket ini
    const activeRooms = new Set();

    // Fungsi helper untuk validasi akses room
    // const validateRoomAccess = async (roomId, userId) => {
    //     const room = await Chatroom.findById(roomId);
    //     return room && room.participants.includes(userId);
    // }

    // Get online users
    socket.on("getOnlineUsers", async () => {
        try {
            const onlineUser = Array.from(io.userSockets.keys());
            const users = await User.find(
                {_id: {$in: onlineUser}}, "username avatar status lastSeen");
                socket.emit("onlineUsers", users);
        } catch (error) {
            socket.emit("Error", {message: error.message});
        }
    });

    // Private chat handlers
    socket.on("initialPrivateChat", async ({receiverId}) => {
        try {
            // Get chat history
            const messages = await Message.find({
                messageType: "private",
                $or: [
                    {sender: socket.userId, receiver: receiverId},
                    {sender: receiverId, receiver: socket.userId},
                ]
            }).sort({createdAt: -1}).limit(50).populate("sender", "username avatar").populate("receiver", "username avatar");

            // Get receiver status
            const isReceiverOnline = io.userSockets.has(receiverId);

            socket.emit("privateChatInitiated", {
                withUser: receiverId,
                messages: messages.reverse(),
                isOnline: isReceiverOnline,
            })
        } catch (error) {
            socket.emit("Error", {message: error.message});
        }
    });

    socket.on("sendPrivateMessage", async (data) => {
        try {
            const {receiverId, message, messageType} = data;

            if (!message?.trim()) {
                throw new Error("Message is required");
            }

            // Rate limiting
            const now = Date.now();
            if (socket.lastMessageTime && now - socket.lastMessageTime < 500) {
                throw new Error("Please wait before sending another message");
            }
            socket.lastMessageTime = now;

            // Create and save message
            const newMessage = new Message({
                sender: socket.userId,
                receiver: receiverId,
                message: message.trim(),
                messageType: "private",
                contentType: messageType,
                status: "sent"
            });

            await newMessage.save();
            await newMessage.populate([
                {path: "sender", select: "username avatar"},
                {path: "receiver", select: "username avatar"}
            ]);

            // Send to both user
            socket.emit("newPrivateMessage", {message: newMessage});

            const receiverSocket = io.userSockets.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket).emit("newPrivateMessage", {
                    message: newMessage
                });

                // Update message status to delivered
                newMessage.status = "delivered";
                await newMessage.save();
            }
        } catch (error) {
            socket.emit("Error", {message: error.message});
        }
    });
    
    socket.on("joinRoom", async ({roomId}) => {
        try {
            const room = await Chatroom.findById({
                _id: roomId,
                participants: socket.userId,
            }).populate("participants", "username avatar status");

            if(!room) {
                throw new Error("Don't have access to this room");
            }

            socket.join(`room: ${roomId}`);
            activeRooms.add(roomId);

            // Get room message
            const messages = await Message.find({
                chatRoom: roomId,
                messageType: "room"
            }).sort({createdAt: -1}).limit(50).populate("sender", "username avatar");

            socket.emit("roomJoined", {
                room,
                message: messages.reverse(),
            });

            // Notify others
            socket.to(`room: ${roomId}`).emit("userJoinedRoom", {
                roomId,
                user: {_id: socket.userId}
            });
        } catch (error) {
            socket.emit("Error", {message: error.message});
        }
    });

    socket.on("sendRoomMessage", async (data) => {
        try {
            const {roomId, message, messageType = "text"} = data;

            if (!message?.trim() || !roomId) {
                throw new Error("Incomplete data");
            }

            if (!activeRooms.has(roomId)) {
                throw new Error("You have not joined this room");
            }

            // Rate limiting
            const now = Date.now();
            if (socket.lastMessageTime && now - socket.lastMessageTime < 500) {
                throw new Error("Please wait before sending another message");
            }
            socket.lastMessageTime = now;

            // Create and save message
            const newMessage = new Message({
                sender: socket.userId,
                chatRoom: roomId,
                message: message.trim(),
                messageType: "room",
                contentType: messageType,
            });

            await newMessage.save();
            await newMessage.populate("sender", "username avatar");

            await Chatroom.findByIdAndUpdate(roomId, {
                $push: {messages: newMessage._id},
                $set: {lastMessage: newMessage._id}
            });

            // Broadcast to room
            io.to(`room: ${roomId}`).emit("newRoomMessage", {
                roomId,
                message: newMessage
            });
        } catch (error) {
            socket.emit("Error", {message: error.message});
        }
    });

    socket.on("typing", ({roomId, receiverId}) => {
        if (roomId && activeRooms.has(roomId)) {
            socket.to(`room: ${roomId}`).emit("userTyping", {
                userId: socket.userId,
                roomId
            });
        } else if (receiverId) {
            const receiverSocket = io.userSockets.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket).emit("userTyping", {
                    userId: socket.userId,
                });
            }
        }
    });

    socket.on("stopTyping", ({ roomId, receiverId }) => {
        if (roomId && activeRooms.has(roomId)) {
            socket.to(`room:${roomId}`).emit("userStoppedTyping", {
                userId: socket.userId,
                roomId
            });
        } else if (receiverId) {
            const receiverSocket = io.userSockets.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket).emit("userStoppedTyping", {
                    userId: socket.userId
                });
            }
        }
    });

    socket.on("markMessageRead", async ({messageId}) => {
        try {
            const message = await Message.findById(messageId);
            if (message && message.receiver.toString() === socket.userId) {
                message.status = "read";
                message.readAt = new Date();
                await message.save();

                // Notify sender
                const senderSocket = io.userSockets.get(message.sender.toString());
                if (senderSocket) {
                    io.to(senderSocket).emit("messageRead", {messageId});
                }
            }
        } catch (error) {
            socket.emit("Erorr", {message: error.message});
        }
    })

    socket.on("leaveRoom", async (data) => {
        try {
            const {roomId} = data;
            if (!roomId) {
                throw new Error("Room ID is required");
            }

            if (activeRooms.has(roomId)) {
                socket.leave(`room: ${roomId}`);
                activeRooms.delete(roomId);

                // Broadcast ke room bahwa user keluar
                socket.io(`room: ${roomId}`).emit("userLeft", {
                    userId: socket.userId,
                    roomId: roomId
                });
            }
        } catch (error) {
            socket.emit("Error", {message: error.message});
        }
    });

    socket.on("disconnect", () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id} (User: ${socket.userId})`);
        
        io.userSockets.delete(socket.userId);
        
        // Notify rooms and private chats
        socket.broadcast.emit("userOffline", { userId: socket.userId });
        
        for (const roomId of activeRooms) {
            socket.to(`room:${roomId}`).emit("userLeftRoom", {
                roomId,
                userId: socket.userId
            });
        }
        
        activeRooms.clear();
    });
}

export default handleSocketConnection;