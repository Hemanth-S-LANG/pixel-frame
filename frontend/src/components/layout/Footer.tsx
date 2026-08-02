"use client";

import Link from "next/link";
import { Globe, Play, Image } from "lucide-react";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Studio", href: "#studio" },
  { label: "Contact", href: "#contact" },
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
              Marcus <span className="text-primary">Cole</span>
            </Link>
            <p className="body-muted text-sm leading-relaxed">
              Cinematographer, photographer, and studio operator based in Silver
              Lake, Los Angeles.
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
                href="mailto:hello@colestudio.com"
                className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
              >
                hello@colestudio.com
              </a>
              <a
                href="tel:+13235550174"
                className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
              >
                +1 (323) 555-0174
              </a>
              <span className="text-muted-foreground text-sm">
                Silver Lake, Los Angeles
              </span>
            </div>
            <div className="flex gap-4">
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
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Cole Studio. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            Built in Los Angeles
          </p>
        </div>
      </div>
    </footer>
  );
}
