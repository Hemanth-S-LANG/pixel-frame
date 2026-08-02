"use client";

import { useState } from "react";
import { Camera, Video, Star, Scissors, ChevronDown, ChevronUp, ArrowRight, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ---- Data ----
const categories = [
  {
    id: "photography",
    icon: Camera,
    num: "01",
    title: "Photography Services",
    subtitle: "Professional photography for every occasion",
    overview: "From weddings to corporate shoots — we capture every emotion with cinematic precision and timeless artistry.",
    color: "text-primary",
    services: [
      {
        title: "Wedding & Pre/Post-Wedding Shoots",
        desc: "Full-day cinematic wedding coverage capturing every heartfelt moment — from the morning rituals to the final dance. Pre-wedding and post-wedding sessions available.",
        price: 15000,
        tags: ["Wedding", "Candid", "Traditional"],
      },
      {
        title: "Candid & Traditional Photography",
        desc: "The best of both worlds — spontaneous candid moments blended with classic portrait-style traditional shots for a complete album.",
        price: 8000,
        tags: ["Candid", "Portrait", "Events"],
      },
      {
        title: "Birthday, Baby & Maternity Shoots",
        desc: "Celebrate life's most precious milestones with beautifully lit studio or outdoor sessions tailored to your style and theme.",
        price: 5000,
        tags: ["Baby", "Birthday", "Maternity"],
      },
      {
        title: "Family Portraits & Fashion Portfolios",
        desc: "Timeless family portraits and high-fashion portfolio shoots crafted with professional lighting, backdrops, and expert direction.",
        price: 6000,
        tags: ["Family", "Fashion", "Portfolio"],
      },
      {
        title: "Corporate, Product & Interior Shoots",
        desc: "Clean, high-resolution imagery for brands — product catalogues, office interiors, headshots, and corporate event coverage.",
        price: 10000,
        tags: ["Corporate", "Product", "Interior"],
      },
      {
        title: "Temple Events, Naming Ceremony & Festivals",
        desc: "Cultural and religious event coverage handled with respect and artistry — preserving your traditions for generations.",
        price: 7000,
        tags: ["Temple", "Cultural", "Festivals"],
      },
    ],
  },
  {
    id: "videography",
    icon: Video,
    num: "02",
    title: "Videography Services",
    subtitle: "Cinematic storytelling for every occasion",
    overview: "From cinematic wedding films to brand advertisements — we craft videos that move, inspire, and endure.",
    color: "text-primary",
    services: [
      {
        title: "Cinematic Wedding Movies & Teasers",
        desc: "Feature-length cinematic wedding films with colour-graded storytelling, background scores, and a teaser reel delivered within 7 days.",
        price: 20000,
        tags: ["Wedding Film", "Teaser", "Cinematic"],
      },
      {
        title: "Traditional & Candid Video Coverage",
        desc: "Multi-camera traditional function coverage combined with candid moments — every laugh, every tear, every dance move.",
        price: 12000,
        tags: ["Traditional", "Candid", "Multi-Cam"],
      },
      {
        title: "Corporate & Documentary Films",
        desc: "Professional corporate films, brand documentaries, and institutional videos with scripting, direction, and post-production support.",
        price: 25000,
        tags: ["Corporate", "Documentary", "Brand"],
      },
      {
        title: "Music Videos & Commercial Advertisements",
        desc: "Creative direction, shoot, and post-production for music videos and advertisement films — delivered in broadcast-ready 4K.",
        price: 30000,
        tags: ["Music Video", "Ad Film", "4K"],
      },
      {
        title: "Short Films & YouTube Content",
        desc: "End-to-end production for short films and YouTube channel content — scripting, shoot, edit, and thumbnail design included.",
        price: 18000,
        tags: ["Short Film", "YouTube", "Content"],
      },
      {
        title: "Instagram Reels & Promo Clips",
        desc: "Fast-turnaround vertical reels and promo clips optimised for social media — perfect for events, launches, and brand campaigns.",
        price: 5000,
        tags: ["Reels", "Promo", "Social Media"],
      },
    ],
  },
  {
    id: "premium",
    icon: Star,
    num: "03",
    title: "Premium Services",
    subtitle: "Elite & custom coverage",
    overview: "Cutting-edge production technology and bespoke post-production solutions for clients who demand the extraordinary.",
    color: "text-primary",
    services: [
      {
        title: "Aerial Drone Photography & 4K Videography",
        desc: "DGCA-certified drone pilots delivering breathtaking aerial stills and 4K cinematic drone footage for weddings, real estate, and events.",
        price: 12000,
        tags: ["Drone", "Aerial", "4K"],
      },
      {
        title: "360° Video & Virtual Tour Creation",
        desc: "Immersive 360° virtual tours for real estate, hotels, event venues, and showrooms — viewable on any device or VR headset.",
        price: 20000,
        tags: ["360°", "VR", "Virtual Tour"],
      },
      {
        title: "Live Streaming & LED Wall Display Setup",
        desc: "Professional multi-camera live streaming for weddings, conferences, and events — plus LED wall setup for stunning on-venue displays.",
        price: 15000,
        tags: ["Live Stream", "LED Wall", "Events"],
      },
      {
        title: "Instant Photo Printing & Interactive Photo Booths",
        desc: "Fun, branded photo booth experience with instant prints, custom overlays, and digital sharing — perfect for weddings and parties.",
        price: 8000,
        tags: ["Photo Booth", "Instant Print", "Events"],
      },
      {
        title: "Crane Camera & Multi-Camera Setup",
        desc: "Cinematic crane shots and synchronised multi-camera production rigs for large weddings, stages, and corporate events.",
        price: 18000,
        tags: ["Crane", "Multi-Cam", "Cinema"],
      },
      {
        title: "Slow Motion & High Frame Rate Capture",
        desc: "Stunning slow-motion moments at 120fps–240fps — ideal for first dances, confetti drops, and emotional highlights.",
        price: 10000,
        tags: ["Slow Motion", "HFR", "Cinematic"],
      },
      {
        title: "Digital & Printable Wedding Album Design",
        desc: "Professionally designed 40–60 page wedding albums with premium layout, typography, and print-ready files included.",
        price: 6000,
        tags: ["Album", "Design", "Print"],
      },
      {
        title: "Save the Date & Animated Invitation Videos",
        desc: "Beautifully crafted animated video invitations for weddings, engagements, and events — shareable via WhatsApp and social media.",
        price: 3000,
        tags: ["Animation", "Invitation", "Digital"],
      },
    ],
  },
  {
    id: "editing",
    icon: Scissors,
    num: "04",
    title: "Video Editing",
    subtitle: "Post-production excellence",
    overview: "State-of-the-art editing suite delivering cinematic colour grades, immersive sound, and broadcast-quality master exports.",
    color: "text-primary",
    services: [
      {
        title: "Cinematic Color Correction & Grading",
        desc: "Hollywood-grade colour grading using DaVinci Resolve — transforming raw footage into a visually cohesive, mood-perfect film.",
        price: 8000,
        tags: ["Color Grade", "DaVinci", "Cinema"],
      },
      {
        title: "Sound Mixing & Background Score",
        desc: "Professional audio mixing, noise reduction, and custom background score composition to match the tone of your film perfectly.",
        price: 6000,
        tags: ["Audio", "Sound Mix", "Score"],
      },
      {
        title: "Motion Graphics & Titles Typography",
        desc: "Custom animated title cards, lower thirds, and motion graphics designed to elevate the production value of your film.",
        price: 5000,
        tags: ["Motion Graphics", "Titles", "Animation"],
      },
      {
        title: "Transitions & Visual Effects (VFX)",
        desc: "Creative transitions, light leaks, and VFX compositing — adding cinematic flair and polish to every scene.",
        price: 7000,
        tags: ["VFX", "Transitions", "Effects"],
      },
      {
        title: "Green Screen / Chroma Key Editing",
        desc: "Professional chroma key compositing with clean edges, colour spill correction, and background replacement.",
        price: 6000,
        tags: ["Green Screen", "Chroma", "VFX"],
      },
      {
        title: "YouTube & Instagram Reel Editing",
        desc: "Engaging, algorithm-optimised video edits for YouTube and Instagram Reels — with captions, hooks, and trending transitions.",
        price: 3000,
        tags: ["YouTube", "Reels", "Social"],
      },
      {
        title: "Corporate & Event Film Editing",
        desc: "Clean, professional corporate and event film edits delivered in 2–3 days with full licensed music and branded end cards.",
        price: 8000,
        tags: ["Corporate", "Event", "Quick Turn"],
      },
      {
        title: "High-Bitrate 4K / 8K Master Export",
        desc: "Final master exports in 4K or 8K at the highest bitrate — optimised for streaming, broadcast, and archival storage.",
        price: 4000,
        tags: ["4K", "8K", "Master"],
      },
    ],
  },
  {
    id: "whychooseus",
    icon: Trophy,
    num: "05",
    title: "Why Choose Us",
    subtitle: "The Sapthagiri Advantage",
    overview: "Nearly three decades of creative excellence. Here's what sets Sapthagiri Studio apart from the rest.",
    color: "text-primary",
    services: [
      {
        title: "10+ Years of Creative Experience",
        desc: "With over a decade of hands-on experience in photography and cinematography, we bring deep expertise and a refined artistic eye to every project.",
        price: 0,
        tags: ["Experience", "Expertise", "Legacy"],
      },
      {
        title: "State-of-the-Art Cinema Cameras",
        desc: "We shoot exclusively on professional cinema-grade cameras — delivering ultra-sharp, colour-rich imagery that stands out in every frame.",
        price: 0,
        tags: ["4K", "Cinema", "Equipment"],
      },
      {
        title: "DGCA Certified Drone Operators",
        desc: "Our drone team is fully DGCA certified, ensuring safe, legal, and breathtaking aerial coverage for your events and productions.",
        price: 0,
        tags: ["Drone", "DGCA", "Aerial"],
      },
      {
        title: "Story-Driven Cinematic Editing",
        desc: "We don't just edit footage — we craft narratives. Every cut, transition, and colour grade is designed to tell your story beautifully.",
        price: 0,
        tags: ["Editing", "Storytelling", "Cinematic"],
      },
      {
        title: "Customized & Transparent Packages",
        desc: "No hidden fees, no surprises. Every package is tailored to your specific needs with clear pricing discussed upfront.",
        price: 0,
        tags: ["Transparent", "Custom", "Fair Pricing"],
      },
      {
        title: "100% On-Time Delivery Guarantee",
        desc: "We respect your timeline. Every project is delivered on the agreed date — because your memories shouldn't wait.",
        price: 0,
        tags: ["On-Time", "Reliable", "Committed"],
      },
      {
        title: "Ultra-High 4K Resolution Output",
        desc: "All deliverables are rendered in full 4K resolution — ensuring crystal-clear quality whether viewed on a phone, TV, or cinema screen.",
        price: 0,
        tags: ["4K", "High Resolution", "Quality"],
      },
      {
        title: "Dedicated Customer Support",
        desc: "From your first enquiry to final delivery, our team is available to assist, guide, and keep you informed every step of the way.",
        price: 0,
        tags: ["Support", "Responsive", "Dedicated"],
      },
    ],
  },
];

const formatPrice = (p: number) => `₹${p.toLocaleString("en-IN")}`;

export function Services() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const active = categories.find((c) => c.id === activeCategory) ?? null;

  return (
    <section id="services" className="bg-background py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-16 flex-wrap gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="gold-line" />
              <span className="section-label">What We Do</span>
            </div>
            <h2 className="heading-display" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
              Services Built<br />for Every Vision.
            </h2>
          </div>
          <p className="body-muted max-w-xs self-end">
            Select a category below to explore our full range of services and
            book the one that fits your project.
          </p>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-border">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            const isOpen = activeCategory === cat.id;
            return (
              <div
                key={cat.id}
                className={`border-b border-border ${i % 2 === 0 ? "md:border-r border-border" : ""}`}
              >
                {/* Category header — clickable */}
                <button
                  onClick={() => setActiveCategory(isOpen ? null : cat.id)}
                  className="w-full text-left p-10 group hover:bg-card-hover transition-colors duration-300 flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-10 h-10 border border-border-strong flex items-center justify-center group-hover:border-primary transition-colors duration-300">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <span className="section-label" style={{ fontSize: "0.6rem", letterSpacing: "0.2em" }}>
                        {cat.num}
                      </span>
                    </div>
                    <h3 className="text-foreground mb-2" style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", fontWeight: 400 }}>
                      {cat.title}
                    </h3>
                    <p className="text-muted-foreground text-xs mb-4 uppercase" style={{ letterSpacing: "0.1em" }}>
                      {cat.subtitle}
                    </p>
                    <p className="body-muted text-sm">{cat.overview}</p>
                  </div>
                  <div className={`mt-1 flex-shrink-0 transition-colors duration-300 ${isOpen ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Sub-services dropdown */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      key="sub"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden border-t border-border bg-card/30"
                    >
                      <div className="p-6 grid grid-cols-1 gap-4">
                        {cat.services.map((svc) => (
                          <div key={svc.title}
                            className="border border-border bg-background p-5 hover:border-primary/40 hover:bg-card/60 transition-all duration-200 group/card"
                          >
                            <h4 className="text-foreground font-medium text-sm mb-2 group-hover/card:text-primary transition-colors">
                              {svc.title}
                            </h4>
                            <p className="text-muted-foreground text-xs mb-3 leading-relaxed">
                              {svc.desc}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {svc.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 border border-border text-muted-foreground uppercase"
                                  style={{ letterSpacing: "0.12em", fontSize: "0.5rem" }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              {svc.price > 0 ? (
                                <>
                                  <span className="text-primary font-medium text-sm">
                                    Starting {formatPrice(svc.price)}
                                  </span>
                                  <Link
                                    href="/booking"
                                    className="flex items-center gap-1.5 text-xs uppercase text-primary hover:text-primary-hover transition-colors font-medium"
                                    style={{ letterSpacing: "0.12em" }}
                                  >
                                    Book Now <ArrowRight size={12} />
                                  </Link>
                                </>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium uppercase" style={{ letterSpacing: "0.1em" }}>
                                  ✓ Our Commitment
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
