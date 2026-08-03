"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const numericTarget = parseInt(target.replace(/\D/g, ""));
  const hasPlus = target.includes("+");

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const stepTime = duration / numericTarget;
          const timer = setInterval(() => {
            start++;
            setCount(start);
            if (start >= numericTarget) clearInterval(timer);
          }, stepTime);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [numericTarget]);

  return (
    <div ref={ref}>
      {count}{hasPlus ? "+" : ""}{suffix}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative h-screen min-h-[700px] flex items-end pb-20 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1632187981988-40f3cbaeef5e?w=1920&h=1080&fit=crop&auto=format')`,
          backgroundColor: "var(--background)",
        }}
      />
      {/* Gradient Overlays */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, var(--gradient-overlay-start), var(--gradient-overlay-mid), var(--gradient-overlay-end))`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, var(--gradient-overlay-start), transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-5 flex items-center gap-3"
        >
          <div className="gold-line" />
          <span className="section-label">
            Sapthagiri Studio — Harohalli, Since 1996
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-foreground leading-[0.88] mb-8"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(3.5rem, 9vw, 8.5rem)",
            fontWeight: 400,
          }}
        >
          Frame<br />
          <em className="text-primary not-italic">The</em><br />
          Moment.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="body-muted max-w-sm mb-10"
        >
          "Every Frame Tells a Story. Every Moment Becomes a Memory."
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex items-center gap-8 flex-wrap"
        >
          <Link
            href="/#contact"
            className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary-hover
                       transition-colors duration-300 uppercase text-xs font-medium"
            style={{ letterSpacing: "0.2em" }}
          >
            Book a Session
          </Link>
          <a
            href="#work"
            className="text-foreground hover:text-primary transition-colors duration-300
                       uppercase text-xs flex items-center gap-3"
            style={{ letterSpacing: "0.15em" }}
          >
            View Work <span>→</span>
          </a>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-20 right-8 hidden lg:flex gap-12 text-right z-10">
        {[
          { num: "12+", label: "Years" },
          { num: "340+", label: "Projects" },
          { num: "28", label: "Awards" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            <div
              className="text-primary mb-1"
              style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", fontWeight: 400 }}
            >
              <AnimatedCounter target={s.num} />
            </div>
            <div className="section-label" style={{ fontSize: "0.6rem" }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50">
        <div className="w-px h-10 bg-foreground animate-pulse-line" />
        <span
          className="text-foreground uppercase rotate-90 origin-center"
          style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.3em", fontSize: "0.55rem" }}
        >
          Scroll
        </span>
      </div>
    </section>
  );
}
