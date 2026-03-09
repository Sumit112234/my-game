// import { GameModel } from "@/models/game"
// import mongoose from "mongoose"

// // Connect to MongoDB
// let isConnected = false
// const connectToDatabase = async () => {
//   if (isConnected) return

//   try {
//     await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fantasy-card-game")
//     isConnected = true
//     console.log("MongoDB connected")
//   } catch (error) {
//     console.error("MongoDB connection error:", error)
//     throw new Error("Failed to connect to database")
//   }
// }

// export async function GET() {
//   try {
//     await connectToDatabase()

//     // Get recent games, sorted by date (newest first)
//     const games = await GameModel.find().sort({ date: -1 }).limit(20).lean()

//     return Response.json({ games })
//   } catch (error) {
//     console.error("Error fetching game history:", error)
//     return Response.json({ error: "Failed to fetch game history" }, { status: 500 })
//   }
// }
