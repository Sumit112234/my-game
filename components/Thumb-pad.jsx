import { useState } from "react";

export default function Thumbpad({dpadPress}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  function handleMove(e) {
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left - rect.width / 2;
    const y = touch.clientY - rect.top - rect.height / 2;

    // Clamp movement so thumb doesn't go outside circle
    const maxRadius = rect.width / 2 - 30; // 30 = thumb radius
    const dist = Math.sqrt(x * x + y * y);
    const scale = dist > maxRadius ? maxRadius / dist : 1;

    const newX = x * scale;
    const newY = y * scale;

    setPos({ x: newX, y: newY });

    // Decide direction
    if (Math.abs(newX) > Math.abs(newY)) {
      if (newX > 20) dpadPress("RIGHT");
      else if (newX < -20) dpadPress("LEFT");
    } else {
      if (newY > 20) dpadPress("DOWN");
      else if (newY < -20) dpadPress("UP");
    }
  }

  function handleEnd() {
    console.log("Touch ended");
    setPos({ x: -10, y: -10 });
    dpadPress(null);
  }

  return (
    <div className="flex-1 flex items-center justify-center py-4 bg-black/20">
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        {/* Background ring */}
        <div className="absolute inset-0 rounded-full border-2 border-neon-green/10 bg-black/30" />

        {/* Thumbstick */}
        <div
          data-thumb
          draggable="false"
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute rounded-full bg-neon-green/20 border border-neon-green/30 flex items-center justify-center"
          style={{
            width: 60,
            height: 60,
            top: "39%",
            left: "39%",
            transform: `translate(${pos.x}px, ${pos.y}px)`,
          }}
        >
          ●
        </div>
      </div>
    </div>
  );
}
