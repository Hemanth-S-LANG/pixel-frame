"use client";

import { useState, useEffect } from "react";
import { Menu, X, Download, Camera } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { label: "Services", href: "#services" },
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Studio", href: "#studio" },
  { label: "Contact", href: "#contact" },
];

// Brochure filename must match the actual file in /public
const BROCHURE_PATH = "/Sapthagiri-Studio-Brochure.pdf";

export function Nav() {
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [logoError, setLogoError]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "nav-glass border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-3 flex items-center justify-between">

        {/* Logo — shows actual image if sapthagiri-logo.png is in /public, else styled icon */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          {!logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/sapthagiri-logo.png"
              alt="Sapthagiri Studio"
              className="flex-shrink-0 object-contain"
              style={{ width: "36px", height: "36px", borderRadius: "50%" }}
              onError={() => setLogoError(true)}
            />
          ) : (
            /* Fallback icon — visible until real logo PNG is placed in /public */
            <div className="w-9 h-9 rounded-full border border-primary bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Camera size={16} className="text-primary" />
            </div>
          )}
          <span
            className="text-foreground uppercase text-sm hover:text-primary transition-colors duration-300 leading-tight"
            style={{ fontFamily: "var(--font-serif)", letterSpacing: "0.2em" }}
          >
            Sapthagiri <span className="text-primary">Studio</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link, i) => (
            <motion.a
              key={link.label}
              href={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className={`transition-colors duration-200 uppercase text-[11px] ${
                scrolled
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-foreground/90 hover:text-primary font-medium"
              }`}
              style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}
            >
              {link.label}
            </motion.a>
          ))}

          <ThemeToggle />

          {/* Download Brochure */}
          <a
            href={BROCHURE_PATH}
            download="Sapthagiri-Studio-Brochure.pdf"
            className={`flex items-center gap-1.5 px-4 py-2 border transition-all duration-300 uppercase text-[11px] ${
              scrolled
                ? "border-border text-muted-foreground hover:border-primary hover:text-primary"
                : "border-foreground/30 text-foreground/80 hover:border-primary hover:text-primary"
            }`}
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}
          >
            <Download size={11} />
            Brochure
          </a>

          <Link
            href="/booking"
            className={`px-5 py-2 border transition-all duration-300 uppercase text-[11px] font-medium ${
              scrolled
                ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                : "border-foreground/40 text-foreground hover:bg-foreground hover:text-background"
            }`}
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.2em" }}
          >
            Book Now
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            className="text-foreground hover:text-primary transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background border-t border-border overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-5">
              {links.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => setMenuOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors uppercase text-xs"
                  style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}
                >
                  {link.label}
                </motion.a>
              ))}
              <a
                href={BROCHURE_PATH}
                download="Sapthagiri-Studio-Brochure.pdf"
                onClick={() => setMenuOpen(false)}
                className="self-start flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors uppercase text-xs"
                style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}
              >
                <Download size={12} /> Download Brochure
              </a>
              <Link
                href="/booking"
                onClick={() => setMenuOpen(false)}
                className="self-start px-5 py-2 border border-primary text-primary hover:bg-primary
                           hover:text-primary-foreground transition-all duration-300 uppercase text-xs mt-2"
                style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.2em" }}
              >
                Book Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
