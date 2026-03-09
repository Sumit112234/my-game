// "use client"

// import { useState, useEffect, useRef } from "react"
// import { useSocket } from "@/context/socket-context"
// import { useAuth } from "@/context/auth-context"
// import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { useSound } from "@/hooks/use-sound"

// export function GameChat({ roomId }) {
//   const [messages, setMessages] = useState([])
//   const [message, setMessage] = useState("")
//   const { socket } = useSocket()
//   const { user } = useAuth()
//   const scrollAreaRef = useRef(null)
//   const { playSound } = useSound()

//   useEffect(() => {
//     if (!socket) return

//     // Listen for chat messages
//     socket.on("chatMessage", (data) => {
//       setMessages((prev) => [...prev, data])
//       playSound("chatMessage")

//       // Scroll to bottom
//       setTimeout(() => {
//         if (scrollAreaRef.current) {
//           scrollAreaRef.current.scrollToBottom()
//         }
//       }, 100)
//     })

//     // Listen for game events to add to chat
//     socket.on("gameEvent", (data) => {
//       setMessages((prev) => [
//         ...prev,
//         {
//           type: "event",
//           content: data.message,
//           timestamp: new Date().toISOString(),
//         },
//       ])

//       // Scroll to bottom
//       setTimeout(() => {
//         if (scrollAreaRef.current) {
//           scrollAreaRef.current.scrollToBottom()
//         }
//       }, 100)
//     })

//     return () => {
//       socket.off("chatMessage")
//       socket.off("gameEvent")
//     }
//   }, [socket, playSound])

//   const sendMessage = (e) => {
//     e.preventDefault()
//     if (!message.trim()) return

//     socket.emit("sendMessage", {
//       roomId,
//       content: message,
//     })

//     setMessage("")
//   }

//   return (
//     <Card className="h-[300px] flex flex-col">
//       <CardHeader className="py-3">
//         <CardTitle className="text-sm font-medium">Game Chat</CardTitle>
//       </CardHeader>
//       <CardContent className="flex-grow p-0 overflow-hidden">
//         <ScrollArea className="h-[200px] px-4" ref={scrollAreaRef}>
//           {messages.length === 0 ? (
//             <div className="text-center text-sm text-gray-500 py-4">No messages yet</div>
//           ) : (
//             <div className="space-y-2 pt-2 pb-4">
//               {messages.map((msg, index) => (
//                 <div key={index} className={`flex flex-col ${msg.type === "event" ? "opacity-70" : ""}`}>
//                   {msg.type === "event" ? (
//                     <div className="text-xs text-center italic text-gray-400 py-1 px-2 bg-gray-800/50 rounded">
//                       {msg.content}
//                     </div>
//                   ) : (
//                     <>
//                       <div className="flex items-baseline space-x-2">
//                         <span
//                           className={`font-medium text-xs ${msg.sender === user?.username ? "text-blue-400" : msg.sender.includes("AI") ? "text-purple-400" : "text-gray-300"}`}
//                         >
//                           {msg.sender === user?.username ? "You" : msg.sender}:
//                         </span>
//                         <span className="text-sm">{msg.content}</span>
//                       </div>
//                       <span className="text-[10px] text-gray-500 ml-auto">
//                         {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                       </span>
//                     </>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </ScrollArea>
//       </CardContent>
//       <CardFooter className="pt-2">
//         <form onSubmit={sendMessage} className="flex w-full space-x-2">
//           <Input
//             placeholder="Type a message..."
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             className="flex-grow"
//           />
//           <Button type="submit" size="sm">
//             Send
//           </Button>
//         </form>
//       </CardFooter>
//     </Card>
//   )
// }
