"use client";
import React, { useState, useEffect } from "react";

export default function PixelGrid() {
  const [pixels, setPixels] = useState<boolean[]>([]);
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  const [tileCount, setTileCount] = useState({
    width: 0,
    height: 0,
  });
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    setTileCount({
      width: Math.round(window.innerWidth / 100 + 1),
      height: Math.round(window.innerHeight / 100 + 1),
    });
    // Initialize grid with random states
    const initialPixels: boolean[] = Array(tileCount.width * tileCount.height)
      .fill(0)
      .map(() => Math.random() > 0.5);
    setPixels(initialPixels);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPixels((prevPixels) => {
        const newPixels = [...prevPixels];
        // Randomly toggle 3-8 pixels each interval
        const numToToggle = Math.floor(Math.random() * 6) + 3;

        for (let i = 0; i < numToToggle; i++) {
          const randomIndex = Math.floor(Math.random() * newPixels.length);
          newPixels[randomIndex] = !newPixels[randomIndex];
        }

        return newPixels;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  //monitor window resize
  useEffect(() => {
    const handleResize = () => {
      const hasWindow = typeof window !== "undefined";
      if (!hasWindow) return;
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //regenerate the grid on window resize
  useEffect(() => {
    let totalWidth = windowSize.width / 100 + 2;
    let totalHeight = windowSize.height / 100 + 2;
    let totalTiles = Math.round(totalWidth * totalHeight);
    //setTotalTileCount(totalTiles)
    //console.log("total tile count: " + totalTileCount);
    const newTiles = Array(totalTiles).fill("white");
    setPixels(newTiles);
    setTileCount({
      width: Math.round(window.innerWidth / 100 + 1),
      height: Math.round(window.innerHeight / 100 + 1),
    });
  }, [windowSize]);

  return (
    <div className="flex items-center justify-center inset-0 overflow-hidden bg-gray-900">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(" + tileCount.width + ", 100px)",
          gridTemplateRows: "repeat(" + tileCount.height + ", 100px)",
          gap: "2px",
          height: "100vh",
          backgroundColor: "black",
        }}
      >
        {pixels.map((isOn, index) => (
          <div
            key={index}
            className={`w-full h-full transition-all duration-300 ${
              isOn ? "bg-white" : "bg-background"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
