import mongoose from "mongoose";

const connectDb = async () => {
    try {
        const connect = await mongoose.connect(process.env.DB_URI);
        console.log(`Database connected: ${connect.connection.host} ${connect.connection.name}`);
    } catch (error) {
        console.error("Error connecting to database:", error);
        process.exit(1);
    }
}

export default connectDb;