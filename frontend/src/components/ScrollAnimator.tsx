"use client";

import { useEffect } from "react";

export default function ScrollAnimator() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // keep reference to typing timers so we can clear/reset on leave
    const typingTimers = new WeakMap<HTMLElement, number>();
    const typingControllers = new WeakMap<HTMLElement, { cancel: () => void }>();

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
              const raw = el.getAttribute("data-texts") || el.getAttribute("data-text") || (span && span.dataset.text) || "";
              // support either a JSON array in data-texts or a single text
              let texts: string[] = [];
              try {
                if (el.hasAttribute("data-texts")) texts = JSON.parse(raw || "[]");
                else texts = [raw];
              } catch (e) {
                texts = [raw];
              }

              if (span && texts.length) {
                // cancel previous controller if exists
                const prevCtrl = typingControllers.get(el);
                if (prevCtrl) prevCtrl.cancel();

                let cancelled = false;
                const cancel = () => {
                  cancelled = true;
                };
                typingControllers.set(el, { cancel });

                const speed = parseInt(el.dataset.typingSpeed || "45", 10);
                const pause = parseInt(el.dataset.displayPause || "1600", 10);

                const run = async () => {
                  let idx = 0;
                  while (!cancelled) {
                    const text = texts[idx % texts.length] || "";
                    // type
                    span.innerHTML = "";
                    for (let i = 0; i <= text.length && !cancelled; i++) {
                      span.innerHTML = text.slice(0, i).replace(/\n/g, "<br/>");
                      await new Promise((res) => {
                        const t = window.setTimeout(res, speed);
                        typingTimers.set(span, t);
                      });
                    }
                    if (cancelled) break;
                    // wait while showing full text
                    await new Promise((res) => {
                      const t = window.setTimeout(res, pause);
                      typingTimers.set(span, t);
                    });
                    if (cancelled) break;
                    // delete (reverse)
                    for (let i = text.length; i >= 0 && !cancelled; i--) {
                      span.innerHTML = text.slice(0, i).replace(/\n/g, "<br/>");
                      await new Promise((res) => {
                        const t = window.setTimeout(res, Math.max(20, Math.floor(speed / 2)));
                        typingTimers.set(span, t);
                      });
                    }
                    if (cancelled) break;
                    idx += 1;
                  }
                };

                // start run but don't block
                run();
              }
            }
          } else {
            // leaving viewport: remove reveal class so it can retrigger later
            el.classList.remove("scroll-in");
            // if typing, cancel controller, clear timers and reset so it restarts on re-entry
            if (el.hasAttribute("data-typing")) {
              const span = el.querySelector(".typing-title") as HTMLElement | null;
              const ctrl = typingControllers.get(el);
              if (ctrl) ctrl.cancel();
              typingControllers.delete(el);
              if (span) {
                const prev = typingTimers.get(span);
                if (prev) window.clearInterval(prev);
                typingTimers.delete(span);
                span.innerHTML = "";
                delete span.dataset.typed;
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
