import mongoose from "mongoose";

export const connectDb = () => {
    const Mongo_URI = process.env.MONGO_URI
    try {
        const db = mongoose.connect(Mongo_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log("db connected")
    } catch (error) {
        console.log("error connecting DB", error)
    }
}

