"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
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

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "nav-glass border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-5 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-foreground uppercase text-sm hover:text-primary transition-colors duration-300"
          style={{ fontFamily: "var(--font-serif)", letterSpacing: "0.25em" }}
        >
          Marcus <span className="text-primary">Cole</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
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
