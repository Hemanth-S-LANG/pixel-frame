"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const serviceOptions = [
  "Film & Cinematography",
  "Commercial Photography",
  "Studio Rental",
  "Post-Production",
  "Photoshoot",
  "Other",
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type OtpState = "idle" | "sending" | "sent" | "verifying" | "verified";

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [otpState, setOtpState]   = useState<OtpState>("idle");
  const [otpInput, setOtpInput]   = useState("");
  const [otpError, setOtpError]   = useState("");
  const [sent, setSent]           = useState(false);
  const [sending, setSending]     = useState(false);
  const [submitError, setSubmitError] = useState("");

  const inputClass =
    "w-full bg-input border border-border text-foreground px-4 py-3 focus:outline-none focus:border-primary transition-colors duration-200 placeholder-muted-foreground text-sm";

  // ---- OTP: Send ----
  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setOtpError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setOtpError(""); setOtpState("sending");
    try {
      const res = await fetch(`${API}/messages/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone }),
      });
      const data = await res.json();
      if (data.success) { setOtpState("sent"); }
      else { setOtpError(data.message || "Failed to send OTP"); setOtpState("idle"); }
    } catch { setOtpError("Network error. Try again."); setOtpState("idle"); }
  };

  // ---- OTP: Verify ----
  const handleVerifyOtp = async () => {
    if (!otpInput) { setOtpError("Enter the OTP"); return; }
    setOtpError(""); setOtpState("verifying");
    try {
      const res = await fetch(`${API}/messages/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, otp: otpInput }),
      });
      const data = await res.json();
      if (data.verified) { setOtpState("verified"); }
      else { setOtpError("Incorrect OTP. Please try again."); setOtpState("sent"); }
    } catch { setOtpError("Network error. Try again."); setOtpState("sent"); }
  };

  // ---- Submit form ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpState !== "verified") { setOtpError("Please verify your phone number first"); return; }
    setSending(true); setSubmitError("");
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phoneVerified: true }),
      });
      const data = await res.json();
      if (data.success) { setSent(true); }
      else { setSubmitError(data.message || "Failed to send message"); }
    } catch { setSubmitError("Network error. Please try again."); }
    setSending(false);
  };

  return (
    <section id="contact" className="bg-background py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="gold-line" />
              <span className="section-label">Get in Touch</span>
            </div>
            <h2 className="heading-display mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Let&apos;s Build<br />Something.
            </h2>
            <p className="body-muted mb-12">
              Tell us about your project and timeline. We typically respond
              within one business day. For urgent inquiries, call directly.
            </p>

            <div className="space-y-6">
              {[
                { icon: Mail,  label: "Email",  value: "sapthagiristudio@gmail.com" },
                { icon: Phone, label: "Phone",  value: "9035661669" },
                { icon: MapPin,label: "Studio", value: "Harohalli - 562112" },
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
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-20 border border-border"
                >
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                    <CheckCircle size={48} className="text-primary mb-4" />
                  </motion.div>
                  <h3 className="text-foreground mb-3" style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 400 }}>
                    Message Received
                  </h3>
                  <p className="text-muted-foreground text-sm">We&apos;ll be in touch within one business day.</p>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Name + Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>Full Name *</label>
                      <input type="text" required placeholder="Murali" className={inputClass}
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>Email *</label>
                      <input type="email" required placeholder="you@example.com" className={inputClass}
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>

                  {/* Phone + OTP */}
                  <div>
                    <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                      Phone Number * {otpState === "verified" && (
                        <span className="text-green-500 ml-2 normal-case font-normal flex-inline items-center gap-1">
                          <ShieldCheck size={11} className="inline" /> Verified
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input type="tel" required placeholder="9035661669" className={`${inputClass} flex-1`}
                        value={form.phone} disabled={otpState === "verified"}
                        onChange={(e) => { setForm({ ...form, phone: e.target.value }); setOtpState("idle"); setOtpError(""); }}
                      />
                      {otpState !== "verified" && (
                        <button type="button" onClick={handleSendOtp}
                          disabled={otpState === "sending" || otpState === "sent" || otpState === "verifying"}
                          className="px-4 py-3 bg-primary text-primary-foreground hover:bg-primary-hover
                                     text-xs uppercase font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                          style={{ letterSpacing: "0.1em" }}>
                          {otpState === "sending" ? <><Loader2 size={12} className="animate-spin" /> Sending...</> : "Send OTP"}
                        </button>
                      )}
                    </div>

                    {/* OTP input row */}
                    {(otpState === "sent" || otpState === "verifying") && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex gap-2 items-center">
                        <input type="text" maxLength={6} placeholder="Enter OTP"
                          className="flex-1 bg-input border border-border text-foreground px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-sm tracking-widest"
                          value={otpInput} onChange={(e) => { setOtpInput(e.target.value); setOtpError(""); }} />
                        <button type="button" onClick={handleVerifyOtp} disabled={otpState === "verifying"}
                          className="px-4 py-2.5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground
                                     text-xs uppercase font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap">
                          {otpState === "verifying" ? <Loader2 size={12} className="animate-spin" /> : "Verify"}
                        </button>
                        <button type="button" onClick={handleSendOtp}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap underline">
                          Resend
                        </button>
                      </motion.div>
                    )}

                    {otpError && <p className="text-destructive text-xs mt-1">{otpError}</p>}
                    {otpState === "sent" && !otpError && (
                      <p className="text-muted-foreground text-xs mt-1">OTP sent to {form.phone}. Check your SMS.</p>
                    )}
                  </div>

                  {/* Service */}
                  <div>
                    <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>Service</label>
                    <select className={`${inputClass} appearance-none cursor-pointer`}
                      value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                      <option value="">Select a service</option>
                      {serviceOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>Project Brief *</label>
                    <textarea required rows={5} placeholder="Tell us about your project, timeline, and budget..."
                      className={`${inputClass} resize-none`}
                      value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>

                  {submitError && <p className="text-destructive text-sm">{submitError}</p>}

                  <button type="submit" disabled={sending || otpState !== "verified"}
                    className="flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground
                               hover:bg-primary-hover transition-colors duration-300 uppercase text-xs font-medium
                               disabled:opacity-50"
                    style={{ letterSpacing: "0.2em" }}>
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
