"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote:
      "We are extremely happy with the photography and videography by Sapthagiri Studio. Mr. Murali beautifully captured every precious moment of our baby's naming ceremony with great creativity and attention to detail. The photos and videos are truly memorable, and we highly recommend their services.",
    name: "Hemanth S",
    title: "Naming Ceremony",
    img: "https://images.unsplash.com/photo-1598006839649-5588feb1bae0?w=100&h=100&fit=crop&auto=format&face",
  },
  {
    quote:
      "We had an amazing experience with Sapthagiri Studio for our family portraits. Mr. Murali made everyone feel comfortable and captured natural, beautiful expressions in every shot. The photographs turned out stunning, and we will cherish these memories forever.",
    name: "JayaSurya Reddy M ",
    title: "Family Potraits",
    img: "https://images.unsplash.com/photo-1542992933-ce75d0187ec1?w=100&h=100&fit=crop&auto=format",
  },
  {
    quote:
      "A big thank you to Sapthagiri Studio for making our birthday celebration unforgettable. Mr. Murali and his team captured every smile, candid moment, and special memory perfectly. The quality, professionalism, and timely delivery exceeded our expectations.",
    name: "Harika M",
    title: "Birthday Celebration shoot",
    img: "https://images.unsplash.com/photo-1654765437547-6b572f52ee1a?w=100&h=100&fit=crop&auto=format",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [autoplay, next]);

  return (
    <section className="bg-section-alt py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex items-center gap-3 mb-16">
          <div className="gold-line" />
          <span className="section-label">Client Words</span>
        </div>

        {/* Desktop: Grid View */}
        <div className="hidden md:grid grid-cols-3 gap-px bg-border">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="bg-section-alt p-10 hover:bg-card-hover transition-colors duration-300"
            >
              <div
                className="text-primary mb-6"
                style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", lineHeight: 0.8 }}
              >
                &ldquo;
              </div>
              <p className="body-muted text-sm mb-8 leading-relaxed">{t.quote}</p>
              <div className="flex items-center gap-3 border-t border-border pt-6">
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-10 h-10 object-cover rounded-full"
                  loading="lazy"
                />
                <div>
                  <div className="text-foreground text-sm font-medium">{t.name}</div>
                  <div className="text-muted-foreground text-xs">{t.title}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: Carousel View */}
        <div
          className="md:hidden relative"
          onMouseEnter={() => setAutoplay(false)}
          onMouseLeave={() => setAutoplay(true)}
        >
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4 }}
            className="bg-card p-8 border border-border"
          >
            <div
              className="text-primary mb-4"
              style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", lineHeight: 0.8 }}
            >
              &ldquo;
            </div>
            <p className="body-muted text-sm mb-6 leading-relaxed">
              {testimonials[current].quote}
            </p>
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <img
                src={testimonials[current].img}
                alt={testimonials[current].name}
                className="w-10 h-10 object-cover rounded-full"
              />
              <div>
                <div className="text-foreground text-sm font-medium">
                  {testimonials[current].name}
                </div>
                <div className="text-muted-foreground text-xs">
                  {testimonials[current].title}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Carousel Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={prev} className="text-muted-foreground hover:text-primary transition-colors" aria-label="Previous">
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === current ? "bg-primary" : "bg-border-strong"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button onClick={next} className="text-muted-foreground hover:text-primary transition-colors" aria-label="Next">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
