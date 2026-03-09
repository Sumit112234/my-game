// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { useAuth } from "@/context/auth-context"
// import { useSocket } from "@/context/socket-context"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Switch } from "@/components/ui/switch"
// import { useToast } from "@/components/ui/use-toast"
// import { Sparkles } from "lucide-react"

// export function LandingPage() {
//   const [username, setUsername] = useState("")
//   const [roomId, setRoomId] = useState("")
//   const [accessCode, setAccessCode] = useState("")
//   const [isPrivate, setIsPrivate] = useState(false)
//   const [aiOpponents, setAiOpponents] = useState(0)
//   const router = useRouter()
//   const { login, logout } = useAuth()
//   const { socket, isConnected } = useSocket()
//   const { toast } = useToast()

//   const handleLogin = (e) => {
//     e.preventDefault()
//     if (!username.trim()) {
//       toast({
//         title: "Username Required",
//         description: "Please enter a username to continue",
//         variant: "destructive",
//       })
//       return
//     }
//     login(username)
//   }

//   const createRoom = () => {
//     if (!isConnected) {
//       toast({
//         title: "Connection Error",
//         description: "Not connected to the server",
//         variant: "destructive",
//       })
//       return
//     }

//     socket.emit("createRoom", {
//       isPrivate,
//       accessCode: isPrivate ? accessCode : null,
//       aiOpponents,
//     })

//     socket.once("roomCreated", (data) => {
//       router.push(`/game/${data.roomId}`)
//     })
//   }

//   const joinRoom = () => {
//     if (!isConnected) {
//       toast({
//         title: "Connection Error",
//         description: "Not connected to the server",
//         variant: "destructive",
//       })
//       return
//     }

//     if (!roomId) {
//       toast({
//         title: "Room ID Required",
//         description: "Please enter a room ID to join",
//         variant: "destructive",
//       })
//       return
//     }

//     socket.emit("joinRoom", {
//       roomId,
//       accessCode: accessCode || null,
//     })

//     socket.once("roomJoined", (data) => {
//       router.push(`/game/${roomId}`)
//     })

//     socket.once("roomError", (error) => {
//       toast({
//         title: "Error Joining Room",
//         description: error.message,
//         variant: "destructive",
//       })
//     })
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
//       <div className="max-w-md w-full space-y-8">
//         <div className="text-center">
//           <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Fantasy Card Game</h1>
//           <p className="text-gray-400 mb-8">A real-time multiplayer card game with AI opponents</p>
//         </div>

//         {!useAuth().user ? (
//           <Card>
//             <CardHeader>
//               <CardTitle>Welcome, Adventurer!</CardTitle>
//               <CardDescription>Enter your name to begin your journey</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <form onSubmit={handleLogin}>
//                 <div className="grid w-full items-center gap-4">
//                   <div className="flex flex-col space-y-1.5">
//                     <Label htmlFor="username">Username</Label>
//                     <Input
//                       id="username"
//                       placeholder="Enter your username"
//                       value={username}
//                       onChange={(e) => setUsername(e.target.value)}
//                     />
//                   </div>
//                 </div>
//               </form>
//             </CardContent>
//             <CardFooter>
//               <Button className="w-full" onClick={handleLogin}>
//                 Enter the Realm
//               </Button>
//             </CardFooter>
//           </Card>
//         ) : (
//           <Card>
//             <CardHeader>
//               <CardTitle>Game Lobby</CardTitle>
//               <CardDescription>Create or join a game room</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <Tabs defaultValue="create">
//                 <TabsList className="grid w-full grid-cols-2">
//                   <TabsTrigger value="create">Create Room</TabsTrigger>
//                   <TabsTrigger value="join">Join Room</TabsTrigger>
//                 </TabsList>

//                 <TabsContent value="create" className="space-y-4">
//                   <div className="flex items-center space-x-2">
//                     <Switch id="private-room" checked={isPrivate} onCheckedChange={setIsPrivate} />
//                     <Label htmlFor="private-room">Private Room</Label>
//                   </div>

//                   {isPrivate && (
//                     <div className="flex flex-col space-y-1.5">
//                       <Label htmlFor="access-code">Access Code</Label>
//                       <Input
//                         id="access-code"
//                         placeholder="Enter access code"
//                         value={accessCode}
//                         onChange={(e) => setAccessCode(e.target.value)}
//                       />
//                     </div>
//                   )}

//                   <div className="flex flex-col space-y-1.5">
//                     <Label htmlFor="ai-opponents">AI Opponents</Label>
//                     <div className="flex items-center space-x-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setAiOpponents(Math.max(0, aiOpponents - 1))}
//                         disabled={aiOpponents === 0}
//                       >
//                         -
//                       </Button>
//                       <span className="w-8 text-center">{aiOpponents}</span>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setAiOpponents(Math.min(3, aiOpponents + 1))}
//                         disabled={aiOpponents === 3}
//                       >
//                         +
//                       </Button>
//                       <span className="text-sm text-gray-500">(max 3)</span>
//                     </div>
//                   </div>

//                   <Button className="w-full" onClick={createRoom}>
//                     Create Game
//                   </Button>
//                 </TabsContent>

//                 <TabsContent value="join" className="space-y-4">
//                   <div className="flex flex-col space-y-1.5">
//                     <Label htmlFor="room-id">Room ID</Label>
//                     <Input
//                       id="room-id"
//                       placeholder="Enter room ID"
//                       value={roomId}
//                       onChange={(e) => setRoomId(e.target.value)}
//                     />
//                   </div>

//                   <div className="flex flex-col space-y-1.5">
//                     <Label htmlFor="join-access-code">Access Code (if private)</Label>
//                     <Input
//                       id="join-access-code"
//                       placeholder="Enter access code"
//                       value={accessCode}
//                       onChange={(e) => setAccessCode(e.target.value)}
//                     />
//                   </div>

//                   <Button className="w-full" onClick={joinRoom}>
//                     Join Game
//                   </Button>
//                 </TabsContent>
//               </Tabs>
//             </CardContent>
//             <CardFooter className="flex justify-between">
//               <Button variant="outline" onClick={() => router.push("/stats")}>
//                 View Stats
//               </Button>
//               <Button variant="ghost" onClick={() => logout()}>
//                 Logout
//               </Button>
//             </CardFooter>
//           </Card>
//         )}

//         <div className="text-center mt-8">
//           <Button
//             variant="link"
//             className="text-gray-400 hover:text-white"
//             onClick={() => window.open("https://github.com/yourusername/fantasy-card-game", "_blank")}
//           >
//             <Sparkles className="h-4 w-4 mr-2" />
//             Made with AI SDK
//           </Button>
//         </div>
//       </div>
//     </div>
//   )
// }
