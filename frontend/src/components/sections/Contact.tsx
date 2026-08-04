"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const serviceOptions = [
  "Photography Services",
  "Videography Services",
  "Premium Services",
  "Video Editing",
  "Other",
];

const API          = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const WIDGET_ID    = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID  || "3668626e6164363530363934";
const AUTH_TOKEN   = process.env.NEXT_PUBLIC_MSG91_AUTH_TOKEN || "556661To8EbYr9qBd16a6f53a2P1";

declare global {
  interface Window {
    initSendOTP?: (cfg: {
      widgetId: string;
      tokenAuth: string;
      identifier: string;
      success?: (data: { message: string }) => void;
      failure?: (err: unknown) => void;
    }) => void;
  }
}

type OtpState = "idle" | "loading" | "verified";

export function Contact() {
  const [form, setForm]   = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [otpState, setOtpState] = useState<OtpState>("idle");
  const [otpError, setOtpError] = useState("");
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState<string | null>(null);
  const [sent, setSent]   = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const scriptLoaded = useRef(false);

  const inputClass =
    "w-full bg-input border border-border text-foreground px-4 py-3 focus:outline-none focus:border-primary transition-colors duration-200 placeholder-muted-foreground text-sm";

  // Load MSG91 widget script once
  useEffect(() => {
    if (scriptLoaded.current || typeof window === "undefined") return;
    scriptLoaded.current = true;
    if (document.querySelector('script[src*="otp-provider"]')) return;
    const s = document.createElement("script");
    s.src   = "https://control.msg91.com/app/assets/otp-provider/otp-provider.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  const handleVerify = () => {
    const phone = form.phone.trim();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setOtpError("Enter a valid 10-digit Indian mobile number");
      return;
    }

    // Retry — let user change number
    if (otpState === "loading") return;

    setOtpError("");
    setOtpState("loading");

    const tryWidget = () => {
      if (!window.initSendOTP) {
        // Script not ready yet — retry after 500ms
        setTimeout(tryWidget, 500);
        return;
      }
      window.initSendOTP({
        widgetId:   WIDGET_ID,
        tokenAuth:  AUTH_TOKEN,
        identifier: `91${phone}`,
        success: (_data) => {
          // MSG91 widget called success — OTP verified by MSG91 itself.
          // Call our backend to get a signed phoneVerifiedToken.
          fetch(`${API}/messages/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: _data.message, phone: form.phone.trim() }),
          })
            .then((r) => r.json())
            .then((json) => {
              if (json.verified && json.phoneVerifiedToken) {
                setPhoneVerifiedToken(json.phoneVerifiedToken);
                setOtpState("verified");
                setOtpError("");
              } else {
                setOtpError("Verification failed. Please try again.");
                setOtpState("idle");
              }
            })
            .catch(() => {
              setOtpError("Network error during verification.");
              setOtpState("idle");
            });
        },
        failure: (err) => {
          console.error("MSG91 OTP failure:", err);
          // If captcha failed (localhost issue), fall back to a 4-digit dev bypass
          if (window.location.hostname === "localhost") {
            // On localhost, captcha always fails. Show manual OTP entry instead.
            setOtpError("Running on localhost — captcha blocked. OTP was sent. Enter it below to verify.");
            setOtpState("idle");
            // Trigger dev bypass form
            setDevMode(true);
          } else {
            setOtpError("OTP verification failed. Please try again.");
            setOtpState("idle");
          }
        },
      });
    };

    tryWidget();
  };

  // Dev-mode manual OTP state (for localhost testing)
  const [devMode, setDevMode] = useState(false);
  const [devOtp, setDevOtp]   = useState("");
  const [reqId, setReqId]     = useState("");

  const handleDevSendOtp = async () => {
    const phone = form.phone.trim();
    if (!/^[6-9]\d{9}$/.test(phone)) { setOtpError("Enter a valid 10-digit Indian mobile number"); return; }
    setOtpError("");
    try {
      const res  = await fetch(`${API}/messages/send-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setReqId(data.reqId || "");
        setOtpError("OTP sent! Enter it below.");
      } else {
        setOtpError(data.message || "Failed to send OTP");
      }
    } catch { setOtpError("Network error. Please try again."); }
  };

  const handleDevVerify = async () => {
    if (!devOtp) { setOtpError("Enter the OTP"); return; }
    setOtpError("");
    try {
      const res  = await fetch(`${API}/messages/verify-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reqId, otp: devOtp, phone: form.phone.trim() }),
      });
      const data = await res.json();
      if (data.verified && data.phoneVerifiedToken) {
        setPhoneVerifiedToken(data.phoneVerifiedToken);
        setOtpState("verified");
        setDevMode(false);
      } else { setOtpError(data.message || "Incorrect OTP. Try again."); }
    } catch { setOtpError("Network error."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpState !== "verified") { setOtpError("Please verify your phone number first"); return; }
    setSending(true); setSubmitError("");
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Send the server-issued JWT proof — never a raw boolean
          ...(phoneVerifiedToken ? { phoneVerifiedToken } : {}),
        }),
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
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="gold-line" /><span className="section-label">Get in Touch</span>
            </div>
            <h2 className="heading-display mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Let&apos;s Build<br />Something.
            </h2>
            <p className="body-muted mb-12">
              Tell us about your project and timeline. We typically respond within one business day.
              For urgent inquiries, call directly.
            </p>
            <div className="space-y-6">
              {[
                { icon: Mail,   label: "Email",  value: "sapthagiristudio@gmail.com" },
                { icon: Phone,  label: "Phone",  value: "9035661669" },
                { icon: MapPin, label: "Studio", value: "Harohalli - 562112" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-9 h-9 border border-border flex items-center justify-center flex-shrink-0 mt-0.5 rounded-sm">
                    <Icon size={14} className="text-primary" />
                  </div>
                  <div>
                    <div className="section-label mb-0.5" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>{label}</div>
                    <div className="text-foreground text-sm">{value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-border">
              <div className="section-label mb-3" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>Business Hours</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mon – Sat</span>
                  <span className="text-foreground font-medium">9:00 AM – 8:00 PM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sunday</span>
                  <span className="text-primary text-xs font-medium uppercase" style={{ letterSpacing: "0.1em" }}>By Appointment</span>
                </div>
              </div>
            </div>

            {/* WhatsApp quick contact */}
            <div className="mt-6">
              <a
                href="https://wa.me/919035661669"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 py-3 border border-green-500/40 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </motion.div>

          {/* Right Column — Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-20 border border-border">
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
                      <input type="text" required placeholder="Your name" className={inputClass}
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
                      Phone Number *{" "}
                      {otpState === "verified" && (
                        <span className="text-green-500 ml-2 normal-case font-normal text-xs">
                          <ShieldCheck size={11} className="inline mb-0.5" /> Verified
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input type="tel" required placeholder="9035661669" className={`${inputClass} flex-1`}
                        value={form.phone} disabled={otpState === "verified"}
                        onChange={(e) => { setForm({ ...form, phone: e.target.value }); setOtpState("idle"); setOtpError(""); setDevMode(false); setPhoneVerifiedToken(null); }} />
                      {otpState !== "verified" && (
                        <button type="button" onClick={devMode ? handleDevSendOtp : handleVerify}
                          disabled={otpState === "loading"}
                          className="px-4 py-3 bg-primary text-primary-foreground hover:bg-primary-hover text-xs uppercase font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                          style={{ letterSpacing: "0.1em" }}>
                          {otpState === "loading" ? "Opening..." : devMode ? "Send OTP" : "Verify OTP"}
                        </button>
                      )}
                    </div>

                    {/* Dev-mode manual OTP entry */}
                    <AnimatePresence>
                      {devMode && reqId && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }} className="mt-2 flex gap-2">
                          <input type="text" inputMode="numeric" maxLength={6} placeholder="Enter OTP"
                            className="flex-1 bg-input border border-border text-foreground px-4 py-2.5 focus:outline-none focus:border-primary text-sm tracking-widest"
                            value={devOtp} onChange={(e) => { setDevOtp(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleDevVerify()} autoFocus />
                          <button type="button" onClick={handleDevVerify}
                            className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover text-xs uppercase font-semibold transition-colors">
                            Verify
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {otpError && <p className={`text-xs mt-1.5 ${otpError.includes("OTP sent") ? "text-muted-foreground" : "text-destructive"}`}>{otpError}</p>}
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
                    className="flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-300 uppercase text-xs font-medium disabled:opacity-50"
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
