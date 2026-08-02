"use client";

import { Film, Camera, Building2, Scissors } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const services = [
  {
    icon: Film,
    title: "Film & Cinematography",
    desc: "Feature films, short films, music videos, and branded content. From pre-production planning to final delivery, we handle every frame with intention.",
    tags: ["Feature Film", "Music Video", "Documentary"],
    programQuery: "cinematography",
  },
  {
    icon: Camera,
    title: "Commercial Photography",
    desc: "Product, editorial, corporate, and campaign photography. Still images that hold attention and communicate value at a glance.",
    tags: ["Editorial", "Product", "Campaign"],
    programQuery: "photography",
  },
  {
    icon: Building2,
    title: "Studio Rental",
    desc: "2,400 sq ft of fully equipped production space in central Los Angeles. Cyclorama wall, professional grid lighting, and a dedicated client lounge.",
    tags: ["Cyclorama", "Grid Lighting", "Full Day"],
    programQuery: "studio-rental",
  },
  {
    icon: Scissors,
    title: "Post-Production",
    desc: "Color grading, editing, and finishing services. We work in ACES and deliver to broadcast, streaming, and theatrical specifications.",
    tags: ["Color Grading", "Editing", "DCP"],
    programQuery: "post-production",
  },
  {
    icon: Camera,
    title: "5 Rupee Photoshoot",
    desc: "A quick 15-minute test photoshoot session in our fully equipped studio. Great for tests and quick headshots.",
    tags: ["Photoshoot", "Test", "Quick"],
    programQuery: "photoshoot",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export function Services() {
  return (
    <section id="services" className="bg-background py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex items-start justify-between mb-16 flex-wrap gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="gold-line" />
              <span className="section-label">What We Do</span>
            </div>
            <h2
              className="heading-display"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
            >
              Services Built<br />for Production.
            </h2>
          </div>
          <p className="body-muted max-w-xs self-end">
            Every engagement is led by Marcus personally — no handoffs, no
            junior staff on set.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 border-t border-border"
        >
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                variants={cardVariants}
                className={`p-10 border-b border-border group hover:bg-card-hover transition-colors duration-300 ${
                  i % 2 === 0 ? "md:border-r border-border" : ""
                }`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 border border-border-strong flex items-center justify-center group-hover:border-primary transition-colors duration-300">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <span className="section-label" style={{ fontSize: "0.6rem", letterSpacing: "0.2em" }}>
                    0{i + 1}
                  </span>
                </div>
                <h3
                  className="text-foreground mb-4"
                  style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", fontWeight: 400 }}
                >
                  {s.title}
                </h3>
                <p className="body-muted mb-6 text-sm">
                  {s.desc}
                </p>
                <div className="flex gap-2 flex-wrap mb-6">
                  {s.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 border border-border text-muted-foreground uppercase"
                      style={{ letterSpacing: "0.15em", fontSize: "0.55rem" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/booking?program=${s.programQuery}`}
                  className="text-primary hover:text-primary-hover text-xs uppercase transition-colors duration-200 inline-flex items-center gap-2"
                  style={{ letterSpacing: "0.15em" }}
                >
                  Book This Service <span>→</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
