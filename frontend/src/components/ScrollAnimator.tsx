"use client";

import { useEffect } from "react";

export default function ScrollAnimator() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // keep reference to typing timers so we can clear/reset on leave
    const typingTimers = new WeakMap<HTMLElement, number>();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            // entering viewport: add reveal class
            el.classList.add("scroll-in");

            // if element has data-typing, start typing (restartable)
            if (el.hasAttribute("data-typing")) {
              const span = el.querySelector(".typing-title") as HTMLElement | null;
              const text = el.dataset.text || (span && span.dataset.text) || "";
              if (span && text) {
                // clear any existing timer
                const prev = typingTimers.get(span);
                if (prev) window.clearInterval(prev);
                // allow explicit newline characters in data-text to render as <br>
                span.innerHTML = "";
                span.dataset.typed = "1";
                let i = 0;
                const speed = parseInt(el.dataset.typingSpeed || "45", 10);
                const timer = window.setInterval(() => {
                  i += 1;
                  // render newlines as <br> so we can force line breaks in the headline
                  span.innerHTML = text.slice(0, i).replace(/\n/g, "<br/>");
                  if (i >= text.length) {
                    window.clearInterval(timer);
                    typingTimers.delete(span);
                    // stop blinking cursor (make it static)
                    const cursor = el.querySelector('.typing-cursor') as HTMLElement | null;
                    if (cursor) {
                      cursor.style.animation = 'none';
                    }
                  }
                }, speed);
                typingTimers.set(span, timer);
              }
            }
          } else {
            // leaving viewport: remove reveal class so it can retrigger later
            el.classList.remove("scroll-in");
            // if typing, clear and reset so it restarts on re-entry
            if (el.hasAttribute("data-typing")) {
              const span = el.querySelector(".typing-title") as HTMLElement | null;
              if (span) {
                const prev = typingTimers.get(span);
                if (prev) window.clearInterval(prev);
                typingTimers.delete(span);
                span.innerHTML = "";
                delete span.dataset.typed;
                // restore cursor blink so it will animate on next start
                const cursor = el.querySelector('.typing-cursor') as HTMLElement | null;
                if (cursor) {
                  cursor.style.animation = '';
                }
              }
            }
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );


    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll]")).map((el, idx) => {
      // set stagger delay if provided index
      if (!el.style.getPropertyValue("--delay")) {
        el.style.setProperty("--delay", `${idx * 120}ms`);
      }
      io.observe(el);
      return el;
    });

    // also observe data-typing containers (if not same as data-scroll)
    const typingEls = Array.from(document.querySelectorAll<HTMLElement>("[data-typing]")).filter((e) => !nodes.includes(e));
    typingEls.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
