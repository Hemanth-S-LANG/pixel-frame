"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const stats = [
  { num: "12+", label: "Years on Set" },
  { num: "340+", label: "Projects Completed" },
  { num: "28", label: "Industry Awards" },
  { num: "3", label: "Continents Shot" },
];

const credits = [
  "A24 — Short Film Program",
  "Nike Global Campaign 2023",
  "Netflix Original Content",
  "Vogue Italia — Editorial",
  "Warner Music Group",
  "Sundance Selection 2022",
];

function StatCounter({ target }: { target: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const numericTarget = parseInt(target.replace(/\D/g, ""));
  const hasPlus = target.includes("+");

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 1800;
          const stepTime = Math.max(duration / numericTarget, 15);
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

  return <div ref={ref}>{count}{hasPlus ? "+" : ""}</div>;
}

export function About() {
  return (
    <section id="about" className="bg-section-alt py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -top-4 -left-4 w-24 h-24 border border-primary opacity-30 z-0" />
            <img
              src="https://images.unsplash.com/photo-1587050265310-1a2d98ccce5f?w=720&h=900&fit=crop&auto=format"
              alt="Marcus Cole, cinematographer, on set holding camera"
              className="relative z-10 w-full object-cover"
              style={{ maxHeight: "600px" }}
              loading="lazy"
            />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border border-border z-0" />
            <div className="mt-6 p-6 bg-card border-l-2 border-primary">
              <p className="section-label mb-1" style={{ fontSize: "0.6rem" }}>
                Currently Available For
              </p>
              <p className="text-foreground text-sm">
                Feature films, branded content &amp; studio bookings in Q3–Q4 2026
              </p>
            </div>
          </motion.div>

          {/* Text Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="gold-line" />
              <span className="section-label">The Filmmaker</span>
            </div>

            <h2
              className="heading-display mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Marcus Cole,<br />
              <em className="text-muted-foreground">DP &amp; Photographer</em>
            </h2>

            <p className="body-muted mb-5">
              I began shooting on 16mm film in 2012, cutting my teeth on
              documentary work across Southeast Asia and East Africa. That
              foundation in observational filmmaking taught me something that no
              lighting rig can replicate — how to read a moment before it
              happens.
            </p>
            <p className="body-muted mb-10">
              Today, Cole Studio operates from a permanent location in Silver
              Lake, Los Angeles. We partner with directors, agencies, and brands
              who understand that the visual decisions made in pre-production
              determine everything downstream.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6 mb-10 pb-10 border-b border-border">
              {stats.map((s) => (
                <div key={s.label}>
                  <div
                    className="text-primary mb-1"
                    style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 400 }}
                  >
                    <StatCounter target={s.num} />
                  </div>
                  <div className="section-label" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Credits */}
            <div>
              <p className="section-label mb-4" style={{ fontSize: "0.6rem" }}>
                Selected Credits
              </p>
              <div className="grid grid-cols-2 gap-y-3">
                {credits.map((credit) => (
                  <div key={credit} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">{credit}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
