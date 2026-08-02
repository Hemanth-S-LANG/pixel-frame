"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const features = [
  "Cinema Cameras",
  "4K Mirrorless",
  "Drone Systems",
  "Gimbals & Stabilization",
  "Studio Lighting",
  "Wireless Audio",
  "360° Cameras",
  "Action Cams",
  ,
];

const rates = [
  { label: "Half Day (5 hrs)", price: "₹650", rawPrice: 65000 },
  { label: "Full Day (10 hrs)", price: "₹1,100", rawPrice: 110000 },
  { label: "Overnight (10pm–8am)", price: "₹750", rawPrice: 75000 },
  { label: "Weekly Block (5 days)", price: "₹4,800", rawPrice: 480000 },
];

export function Studio() {
  return (
    <section id="studio" className="bg-background py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="gold-line" />
          <span className="section-label">The Space</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2
              className="heading-display mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
            >
              Sapthagiri Studio —<br />Harohalli, Since 1996.
            </h2>
            <p className="body-muted mb-8">
              Built for photographers, cinematographers, and creative teams.
              Our studio is designed around the reality of long production days —
              professional lighting rigs, proper power, and enough space to bring
              any vision to life. Available for rent with or without crew.
            </p>

            {/* Studio Logo — fills the left column space */}
            <div className="flex justify-center mb-10">
              <img
                src="/sapthagiri-logo.png"
                alt="Sapthagiri Studio Logo"
                className="w-64 h-64 object-contain"
                loading="lazy"
              />
            </div>

            <div className="grid grid-cols-2 gap-y-3 mb-10">
              {features.map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03, duration: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 size={12} className="text-primary flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <img
              src="/photography and videography.png"
              alt="Sapthagiri Studio — Professional Photography & Videography"
              className="w-full h-auto block"
              loading="lazy"
            />
          </motion.div>
        </div>

        {/* Rates */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="border-t border-border pt-12"
        >
          <p className="text-foreground mb-6 uppercase text-xs" style={{ letterSpacing: "0.25em" }}>
            Studio Rates
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
            {rates.map((r) => (
              <Link
                key={r.label}
                href="/booking?program=studio-rental"
                className="bg-background p-6 hover:bg-card-hover transition-colors duration-200 group"
              >
                <div
                  className="text-primary mb-2 group-hover:text-primary-hover transition-colors"
                  style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 400 }}
                >
                  {r.price}
                </div>
                <div className="text-muted-foreground text-sm">{r.label}</div>
              </Link>
            ))}
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            All rates exclude applicable tax. Equipment packages, crew, and
            catering available as add-ons.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
