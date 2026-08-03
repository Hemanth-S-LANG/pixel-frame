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
  { icon: Play,  href: "#", label: "Vimeo" },
  { icon: Globe, href: "https://wa.me/919035661669", label: "WhatsApp", isWhatsApp: true },
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
                href="/#services"
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
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    aria-label={s.label}
                    className="w-9 h-9 border border-border flex items-center justify-center
                               text-muted-foreground hover:border-primary hover:text-primary
                               transition-all duration-200 rounded-full"
                  >
                    {"isWhatsApp" in s && s.isWhatsApp ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    ) : (
                      <Icon size={14} />
                    )}
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
