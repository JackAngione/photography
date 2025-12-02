"use client";
import React, { useState, useEffect } from "react";

export default function AnaglyphShadow({
  children,
}: {
  children: React.ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  //this doesn't technically do anything ATM, but it's here if needed
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let scrollTimeout: any;
    let animationFrame: any;

    const handleScroll = () => {
      setIsScrolling(true);
      setOffset(2); // Fixed offset while scrolling

      clearTimeout(scrollTimeout);
      cancelAnimationFrame(animationFrame);

      setIsScrolling(false);

      // Animate offset back to 0
      const startTime = performance.now();
      //THIS SHOULD MATCH THE setOffset(x) ABOVE!!!
      const startOffset = 2;
      const duration = 300; // Duration of fade animation in ms

      const animate = (currentTime: any) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const newOffset = startOffset * (1 - Math.pow(progress, 2));
        setOffset(newOffset);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      style={{
        textShadow: `${offset}px 0px 0px rgba(0, 255, 255, 1), -${offset}px 0px 0px rgba(255, 0, 0, 1)`,
      }}
    >
      {children}
    </div>
  );
}
