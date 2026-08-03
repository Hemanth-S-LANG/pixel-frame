"use client";

import Link from "next/link";
import { Globe, Play, Image } from "lucide-react";

const navLinks = [
  { label: "Services", href: "/#services" },
  { label: "Work",     href: "/#work" },
  { label: "About",    href: "/#about" },
  { label: "Studio",   href: "/#studio" },
  { label: "Contact",  href: "/#contact" },
];

const socialLinks = [
  { icon: Image, href: "#", label: "Instagram" },
  { icon: Play, href: "#", label: "Vimeo" },
  { icon: Globe, href: "#", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 pb-12 border-b border-border">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-foreground uppercase text-sm block mb-3 hover:text-primary transition-colors"
              style={{ fontFamily: "var(--font-serif)", letterSpacing: "0.25em" }}
            >
              Sapthagiri <span className="text-primary">Studio</span>
            </Link>
            <p className="body-muted text-sm leading-relaxed">
              Photography, cinematography, and fully equipped studio space in Harohalli. Since 1996.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p
              className="section-label mb-5"
              style={{ fontSize: "0.6rem" }}
            >
              Navigation
            </p>
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 uppercase text-xs"
                  style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/booking"
                className="text-primary hover:text-primary-hover transition-colors duration-200 uppercase text-xs"
                style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}
              >
                Book a Session →
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p
              className="section-label mb-5"
              style={{ fontSize: "0.6rem" }}
            >
              Contact
            </p>
            <div className="flex flex-col gap-2 mb-6">
              <a
                href="mailto:sapthagiristudio@gmail.com"
                className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
              >
                sapthagiristudio@gmail.com
              </a>
              <a
                href="tel:+919035661669"
                className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
              >
                9035661669
              </a>
              <span className="text-muted-foreground text-sm">
                Harohalli - 562112
              </span>
            </div>
            <div className="flex gap-4 mb-6">
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-9 h-9 border border-border flex items-center justify-center
                               text-muted-foreground hover:border-primary hover:text-primary
                               transition-all duration-200 rounded-full"
                  >
                    <Icon size={14} />
                  </a>
                );
              })}
            </div>
            {/* Business Hours */}
            <div className="pt-4 border-t border-border">
              <p className="section-label mb-2" style={{ fontSize: "0.55rem", letterSpacing: "0.15em" }}>
                Business Hours
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Mon – Sat</span>
                  <span className="text-foreground">9:00 AM – 8:00 PM</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sunday</span>
                  <span className="text-primary" style={{ letterSpacing: "0.05em" }}>By Appointment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Sapthagiri Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
