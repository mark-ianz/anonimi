"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

interface BackToTopProps {
  threshold?: number;
}

export default function BackToTop({ threshold = 600 }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > threshold);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  function handleClick() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      aria-label="Back to top"
      onClick={handleClick}
      className={
        "cursor-pointer fixed right-6 bottom-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-250 hover:bg-primary/80 " +
        (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")
      }
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
