// "use client"

// import { useState, useEffect } from "react"
// import { useRouter } from "next/navigation"
// import { useAuth } from "@/context/auth-context"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { LoadingScreen } from "@/components/loading-screen"

// export default function StatsPage() {
//   const [isLoading, setIsLoading] = useState(true)
//   const [gameHistory, setGameHistory] = useState([])
//   const [leaderboard, setLeaderboard] = useState([])
//   const { user } = useAuth()
//   const router = useRouter()

//   useEffect(() => {
//     if (!user) {
//       router.push("/")
//       return
//     }

//     const fetchStats = async () => {
//       try {
//         const [historyRes, leaderboardRes] = await Promise.all([
//           fetch("/api/stats/history"),
//           fetch("/api/stats/leaderboard"),
//         ])

//         if (historyRes.ok && leaderboardRes.ok) {
//           const history = await historyRes.json()
//           const leaders = await leaderboardRes.json()

//           setGameHistory(history.games)
//           setLeaderboard(leaders.players)
//         }
//       } catch (error) {
//         console.error("Failed to fetch stats:", error)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchStats()
//   }, [user, router])

//   if (isLoading) {
//     return <LoadingScreen message="Loading stats..." />
//   }

//   return (
//     <div className="container mx-auto py-8">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">Game Statistics</h1>
//         <Button onClick={() => router.push("/")}>Back to Home</Button>
//       </div>

//       <Tabs defaultValue="history">
//         <TabsList className="grid w-full grid-cols-2">
//           <TabsTrigger value="history">Game History</TabsTrigger>
//           <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
//         </TabsList>

//         <TabsContent value="history">
//           <Card>
//             <CardHeader>
//               <CardTitle>Recent Games</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Date</TableHead>
//                     <TableHead>Room</TableHead>
//                     <TableHead>Players</TableHead>
//                     <TableHead>Winner</TableHead>
//                     <TableHead>Duration</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {gameHistory.length > 0 ? (
//                     gameHistory.map((game) => (
//                       <TableRow key={game._id}>
//                         <TableCell>{new Date(game.date).toLocaleDateString()}</TableCell>
//                         <TableCell>{game.roomId}</TableCell>
//                         <TableCell>{game.players.join(", ")}</TableCell>
//                         <TableCell className="font-medium">{game.winner}</TableCell>
//                         <TableCell>{game.duration}s</TableCell>
//                       </TableRow>
//                     ))
//                   ) : (
//                     <TableRow>
//                       <TableCell colSpan={5} className="text-center">
//                         No games played yet
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="leaderboard">
//           <Card>
//             <CardHeader>
//               <CardTitle>Top Players</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Rank</TableHead>
//                     <TableHead>Player</TableHead>
//                     <TableHead>Games</TableHead>
//                     <TableHead>Wins</TableHead>
//                     <TableHead>Win Rate</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {leaderboard.length > 0 ? (
//                     leaderboard.map((player, index) => (
//                       <TableRow key={player._id}>
//                         <TableCell>{index + 1}</TableCell>
//                         <TableCell className="font-medium">{player.username}</TableCell>
//                         <TableCell>{player.gamesPlayed}</TableCell>
//                         <TableCell>{player.wins}</TableCell>
//                         <TableCell>
//                           {player.gamesPlayed > 0 ? `${Math.round((player.wins / player.gamesPlayed) * 100)}%` : "0%"}
//                         </TableCell>
//                       </TableRow>
//                     ))
//                   ) : (
//                     <TableRow>
//                       <TableCell colSpan={5} className="text-center">
//                         No player stats available
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }
