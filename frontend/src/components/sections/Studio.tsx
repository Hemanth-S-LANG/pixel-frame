"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const features = [
  "2,400 sq ft cyclorama wall",
  "12-foot infinity white cove",
  "Arri SkyPanel S60-C (×8)",
  "Dedolight DLED9 kit",
  "Power: 100A three-phase",
  "Grip truck on-site",
  "Hair & makeup station",
  "Private client lounge",
  "High-speed internet (1 Gbps)",
  "Loading dock access",
  "On-site parking (12 spaces)",
  "24 / 7 key access",
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
              Cole Studio —<br />Silver Lake, LA.
            </h2>
            <p className="body-muted mb-8">
              Built for working filmmakers and photographers. The space is
              designed around the reality of long production days — proper power,
              professional grip, and enough room to swing a boom pole without
              hitting a wall. Available for rent with or without crew.
            </p>
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
              src="https://images.unsplash.com/photo-1681137063068-081072cf04b4?w=900&h=700&fit=crop&auto=format"
              alt="Cole Studio interior with professional lighting setup"
              className="w-full object-cover"
              style={{ height: "480px" }}
              loading="lazy"
            />
            <div className="absolute top-4 right-4">
              <img
                src="https://images.unsplash.com/photo-1542992933-ce75d0187ec1?w=300&h=300&fit=crop&auto=format"
                alt="Studio photography in progress"
                className="w-36 h-36 object-cover border-2 border-background"
                loading="lazy"
              />
            </div>
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
