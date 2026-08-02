"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const projects = [
  {
    id: 1,
    title: "The Velvet Hour",
    category: "Fashion Film",
    year: "2024",
    img: "https://images.unsplash.com/photo-1641236210747-48bc43e4517f?w=900&h=600&fit=crop&auto=format",
    wide: true,
  },
  {
    id: 2,
    title: "Echoes",
    category: "Documentary",
    year: "2024",
    img: "https://images.unsplash.com/photo-1695014192203-291edf9e4842?w=600&h=900&fit=crop&auto=format",
    wide: false,
    tall: true,
  },
  {
    id: 3,
    title: "Urban Pulse",
    category: "Music Video",
    year: "2023",
    img: "https://images.unsplash.com/photo-1611784728558-6c7d9b409cdf?w=600&h=600&fit=crop&auto=format",
    wide: false,
  },
  {
    id: 4,
    title: "Solstice Campaign",
    category: "Commercial",
    year: "2024",
    img: "https://images.unsplash.com/photo-1619099619226-f96e319e3732?w=600&h=600&fit=crop&auto=format",
    wide: false,
  },
  {
    id: 5,
    title: "Reverie",
    category: "Studio Portrait",
    year: "2023",
    img: "https://images.unsplash.com/photo-1654765437547-6b572f52ee1a?w=900&h=600&fit=crop&auto=format",
    wide: true,
  },
];

function ProjectCard({ project, index }: { project: (typeof projects)[0]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className={`relative overflow-hidden bg-card cursor-pointer group ${
        project.tall ? "row-span-2" : ""
      } ${project.wide ? "md:col-span-2" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={project.img}
        alt={project.title}
        className={`w-full h-full object-cover transition-transform duration-700 ${
          hovered ? "scale-105" : "scale-100"
        }`}
        style={{ minHeight: project.tall ? "480px" : "280px" }}
        loading="lazy"
      />
      <div
        className={`absolute inset-0 transition-opacity duration-400 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
        }}
      />
      <div
        className={`absolute inset-0 flex flex-col justify-end p-6 transition-all duration-400 ${
          hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-end justify-between">
          <div>
            <span
              className="text-[#C9A84C] uppercase block mb-1"
              style={{ letterSpacing: "0.25em", fontSize: "0.6rem" }}
            >
              {project.category} — {project.year}
            </span>
            <h3
              className="text-white"
              style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 400 }}
            >
              {project.title}
            </h3>
          </div>
          <div className="w-8 h-8 border border-[#C9A84C] flex items-center justify-center flex-shrink-0">
            <ArrowUpRight size={14} className="text-[#C9A84C]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Portfolio() {
  return (
    <section id="work" className="bg-background py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="gold-line" />
              <span className="section-label">Selected Works</span>
            </div>
            <h2
              className="heading-display"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
            >
              Visual Stories<br />That Endure.
            </h2>
          </div>
          <a
            href="#contact"
            className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 uppercase text-xs"
            style={{ letterSpacing: "0.15em" }}
          >
            View All Work <ArrowUpRight size={12} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 auto-rows-[280px]">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
