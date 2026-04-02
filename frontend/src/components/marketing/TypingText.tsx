"use client";

import { useEffect, useRef, useState } from "react";

interface TypingTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

export default function TypingText({ text, className = "", delay = 0, speed = 50 }: TypingTextProps) {
  const ref = useRef(null);
  const [displayText, setDisplayText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setTimeout(() => setStarted(true), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay, started]);

  useEffect(() => {
    if (!started) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span ref={ref} className={className}>
      {displayText}
      {started && <span className="typing-cursor">|</span>}
    </span>
  );
}
