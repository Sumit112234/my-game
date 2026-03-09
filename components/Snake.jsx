"use client";

import { useEffect, useRef, useState } from "react";
import supabase from "../lib/supabase";

const GRID = 20;
const CELL = 20;

export default function Snake() {
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState({});
  const [food, setFood] = useState({ x: 8, y: 8 });

  const channelRef = useRef(null);
  const playerId = useRef(Math.random().toString(36).slice(2));

  const snake = useRef([{ x: 10, y: 10 }]);
  const direction = useRef({ x: 1, y: 0 });

  function joinRoom() {
    const channel = supabase.channel(`snake-room-${room}`);

    channel
      .on("broadcast", { event: "snake_move" }, ({ payload }) => {
        setPlayers((prev) => ({
          ...prev,
          [payload.playerId]: payload.snake,
        }));
      })
      .on("broadcast", { event: "food_spawn" }, ({ payload }) => {
        setFood(payload.food);
      })
      .subscribe();

    channelRef.current = channel;

    setPlayers((prev) => ({
      ...prev,
      [playerId.current]: snake.current,
    }));

    setJoined(true);
  }

  // GAME LOOP
  useEffect(() => {
    if (!joined) return;

    const interval = setInterval(() => {
      moveSnake();
    }, 150);

    return () => clearInterval(interval);
  }, [joined]);

  // KEYBOARD
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "ArrowUp") direction.current = { x: 0, y: -1 };
      if (e.key === "ArrowDown") direction.current = { x: 0, y: 1 };
      if (e.key === "ArrowLeft") direction.current = { x: -1, y: 0 };
      if (e.key === "ArrowRight") direction.current = { x: 1, y: 0 };
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function moveSnake() {
    const body = [...snake.current];

    const head = {
      x: body[0].x + direction.current.x,
      y: body[0].y + direction.current.y,
    };

    body.unshift(head);

    // FOOD COLLISION
    if (head.x === food.x && head.y === food.y) {
      spawnFood();
    } else {
      body.pop();
    }

    snake.current = body;

    setPlayers((prev) => ({
      ...prev,
      [playerId.current]: body,
    }));

    // BROADCAST MOVE
    channelRef.current.send({
      type: "broadcast",
      event: "snake_move",
      payload: {
        playerId: playerId.current,
        snake: body,
      },
    });
  }

  function spawnFood() {
    const newFood = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };

    setFood(newFood);

    channelRef.current.send({
      type: "broadcast",
      event: "food_spawn",
      payload: { food: newFood },
    });
  }

  return (
    <div className="flex flex-col items-center p-10 gap-4">
      {!joined && (
        <>
          <input
            className="border p-2"
            placeholder="Room ID"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />

          <button
            className="bg-green-600 text-white px-4 py-2"
            onClick={joinRoom}
          >
            Join
          </button>
        </>
      )}

      {joined && (
        <div
          className="grid bg-black"
          style={{
            gridTemplateColumns: `repeat(${GRID}, ${CELL}px)`,
          }}
        >
          {[...Array(GRID * GRID)].map((_, i) => {
            const x = i % GRID;
            const y = Math.floor(i / GRID);

            let snakeCell = false;

            Object.values(players).forEach((snake) => {
              snake.forEach((s) => {
                if (s.x === x && s.y === y) snakeCell = true;
              });
            });

            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className={`w-5 h-5 border border-gray-800
                ${snakeCell ? "bg-green-500" : ""}
                ${isFood ? "bg-red-500" : ""}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}