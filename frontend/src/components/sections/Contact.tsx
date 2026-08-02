"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const serviceOptions = [
  "Film & Cinematography",
  "Commercial Photography",
  "Studio Rental",
  "Post-Production",
  "Other",
];

export function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    service: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate send delay
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSent(true);
  };

  const inputClass =
    "w-full bg-input border border-border text-foreground px-4 py-3 focus:outline-none focus:border-primary transition-colors duration-200 placeholder-muted-foreground text-sm";

  return (
    <section id="contact" className="bg-background py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="gold-line" />
              <span className="section-label">Get in Touch</span>
            </div>
            <h2
              className="heading-display mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Let&apos;s Build<br />Something.
            </h2>
            <p className="body-muted mb-12">
              Tell us about your project and timeline. We typically respond
              within one business day. For urgent inquiries, call directly.
            </p>

            <div className="space-y-6">
              {[
                { icon: Mail, label: "Email", value: "hello@colestudio.com" },
                { icon: Phone, label: "Phone", value: "+1 (323) 555-0174" },
                { icon: MapPin, label: "Studio", value: "2840 Rowena Ave, Silver Lake, LA 90039" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-9 h-9 border border-border flex items-center justify-center flex-shrink-0 mt-0.5 rounded-sm">
                      <Icon size={14} className="text-primary" />
                    </div>
                    <div>
                      <div className="section-label mb-0.5" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                        {item.label}
                      </div>
                      <div className="text-foreground text-sm">{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Column — Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-20 border border-border"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle size={48} className="text-primary mb-4" />
                  </motion.div>
                  <h3
                    className="text-foreground mb-3"
                    style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 400 }}
                  >
                    Message Received
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    We&apos;ll be in touch within one business day.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Alex Mercer"
                        className={inputClass}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="alex@company.com"
                        className={inputClass}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                      Service
                    </label>
                    <select
                      className={`${inputClass} appearance-none cursor-pointer`}
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value })}
                    >
                      <option value="">Select a service</option>
                      {serviceOptions.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                      Project Brief *
                    </label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Tell us about your project, timeline, and budget..."
                      className={`${inputClass} resize-none`}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground
                               hover:bg-primary-hover transition-colors duration-300 uppercase text-xs font-medium
                               disabled:opacity-50"
                    style={{ letterSpacing: "0.2em" }}
                  >
                    {sending ? "Sending..." : "Send Message"} <Send size={13} />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
