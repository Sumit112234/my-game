// import { PlayerModel } from "@/models/game"
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

//     // Get top players by win rate
//     const players = await PlayerModel.find({ gamesPlayed: { $gt: 0 } })
//       .sort({ wins: -1, gamesPlayed: 1 })
//       .limit(20)
//       .lean()

//     return Response.json({ players })
//   } catch (error) {
//     console.error("Error fetching leaderboard:", error)
//     return Response.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
//   }
// }
