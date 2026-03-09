import mongoose from "mongoose"

// Game schema
const gameSchema = new mongoose.Schema({
  roomId: String,
  players: [String],
  winner: String,
  duration: Number,
  date: { type: Date, default: Date.now },
})

// Player schema
const playerSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  gamesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
})

// Create models
export const GameModel = mongoose.models.Game || mongoose.model("Game", gameSchema)
export const PlayerModel = mongoose.models.Player || mongoose.model("Player", playerSchema)
