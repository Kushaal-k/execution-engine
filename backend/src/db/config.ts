import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`)

        console.log("MongoDB connected successfully");

    } catch (err) {
        if(err instanceof Error)
            console.error("Error while connecting mongoDB", err.message);
        else    
            console.error("MongoDB failed to connect!");
    }
}

export default connectDB;