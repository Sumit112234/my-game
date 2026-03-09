// "use client"

// import { createContext, useContext, useEffect, useState } from "react"
// import io from "socket.io-client"
// import { useAuth } from "./auth-context"
// import { useToast } from "@/components/ui/use-toast"

// const SocketContext = createContext(null)

// export function SocketProvider({ children }) {
//   const [socket, setSocket] = useState(null)
//   const [isConnected, setIsConnected] = useState(false)
//   const { user } = useAuth()
//   const { toast } = useToast()

//   useEffect(() => {
//     if (!user) return

//     // Create socket connection
//     const socketInstance = io("/api/socket", {
//       path: "/api/socket",
//       addTrailingSlash: false,
//     })

//     // Socket event handlers
//     socketInstance.on("connect", () => {
//       setIsConnected(true)
//       console.log("Socket connected")

//       // Identify user to server
//       socketInstance.emit("identify", { username: user.username })
//     })

//     socketInstance.on("connect_error", (err) => {
//       console.error("Socket connection error:", err)
//       toast({
//         title: "Connection Error",
//         description: "Failed to connect to game server",
//         variant: "destructive",
//       })
//     })

//     socketInstance.on("disconnect", () => {
//       setIsConnected(false)
//       console.log("Socket disconnected")
//     })

//     // Set socket instance
//     setSocket(socketInstance)

//     // Clean up on unmount
//     return () => {
//       socketInstance.disconnect()
//     }
//   }, [user, toast])

//   return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
// }

// export const useSocket = () => {
//   const context = useContext(SocketContext)
//   if (!context) {
//     throw new Error("useSocket must be used within a SocketProvider")
//   }
//   return context
// }
