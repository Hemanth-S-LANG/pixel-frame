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
  "Wedding Photography",
  "Commercial Shoots",
  "Portrait Sessions",
  "Event Coverage",
  "Product Photography",
  "Studio Rentals",
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
              alt="Murali, photographer and studio owner at Sapthagiri Studio"
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
              <span className="section-label">The Studio Owner</span>
            </div>

            <h2
              className="heading-display mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Murali,<br />
              <em className="text-muted-foreground">Photographer &amp; Studio Owner</em>
            </h2>

            <p className="body-muted mb-5">
             We transform life's unforgettable moments into timeless memories. With years of experience in photography, cinematic videography, aerial filming, and creative editing, we deliver premium-quality visual storytelling for every occasion.
            </p>
            <h3>Our Creative Philosophy</h3>
            <p className="body-muted mb-5">
              Every frame we capture is imbued with emotion, light, and artistry. We combine state-of-the-art camera equipment with sophisticated post-production techniques to create masterpieces that last generations.
            </p>
            <h3>Core Expertise</h3>
            <p className="body-muted mb-5">
              High-End Lens & Optics Mastery
              Studio & Location Lighting Rigs
              Aerial Drone Cinematography
              4K Color-Graded Post Production
            </p>
            <p className="body-muted mb-10">
              Today, Sapthagiri Studio operates from a permanent location in
              Harohalli — 562112. We partner with families, brands, and creative
              teams who understand that powerful imagery is built long before the
              shutter clicks.
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
                Services Offered
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
