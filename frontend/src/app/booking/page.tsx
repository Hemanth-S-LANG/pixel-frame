"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, Camera, Building2, Scissors, ArrowLeft, ArrowRight,
  Calendar as CalendarIcon, Clock, User, CreditCard, CheckCircle, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  getPrograms, getAvailableDates, getAvailableSlots, createPaymentOrder,
  verifyPayment, createBooking, getBlockedDatesForMonth,
  type Program, type TimeSlotWithProgram,
} from "@/lib/api";

// ---- Icon mapper ----
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Film, Camera, Building2, Scissors,
};

// ---- Step indicator ----
const steps = [
  { num: 1, label: "Select Program", icon: Film },
  { num: 2, label: "Date & Time",    icon: CalendarIcon },
  { num: 3, label: "Your Details",   icon: User },
  { num: 4, label: "Payment",        icon: CreditCard },
];

// ---- Simple calendar ----
function SimpleCalendar({
  availableDates, blockedDates, blockReasons,
  selectedDate, onSelectDate, currentMonth, onMonthChange,
}: {
  availableDates: string[];
  blockedDates: string[];
  blockReasons: Record<string, string>;
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
}) {
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const monthNames = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
  const dayNames   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          className="text-muted-foreground hover:text-foreground transition-colors p-1" aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-foreground text-sm font-medium" style={{ letterSpacing: "0.1em" }}>
          {monthNames[month]} {year}
        </h3>
        <button onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          className="text-muted-foreground hover:text-foreground transition-colors p-1" aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-muted-foreground text-xs py-1" style={{ letterSpacing: "0.1em" }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const dateStr  = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dateObj  = new Date(year, month, day);
          const isPast      = dateObj < today;
          const isAvailable = availableDates.includes(dateStr);
          const isBlocked   = blockedDates.includes(dateStr);
          const isSelected  = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => isAvailable && !isPast && !isBlocked && onSelectDate(dateStr)}
              disabled={isPast || !isAvailable || isBlocked}
              className={`relative h-10 flex items-center justify-center text-sm transition-all duration-200 rounded-sm
                ${isSelected
                  ? "bg-primary text-primary-foreground font-medium"
                  : isBlocked
                    ? "text-destructive/50 cursor-not-allowed line-through"
                    : isAvailable && !isPast
                      ? "text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer"
                      : "text-muted-foreground/30 cursor-not-allowed"
                }`}
              title={isBlocked ? (blockReasons[dateStr] || "Studio unavailable") : ""}
            >
              {day}
              {isBlocked && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-destructive" />
              )}
              {isAvailable && !isPast && !isSelected && !isBlocked && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Main Booking Page Content ----
function BookingContent() {
  const searchParams = useSearchParams();
  const programQuery = searchParams.get("program");

  const [step, setStep]                   = useState(1);
  const [programs, setPrograms]           = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [currentMonth, setCurrentMonth]   = useState(new Date());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [blockedDates, setBlockedDates]   = useState<string[]>([]);
  const [blockReasons, setBlockReasons]   = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate]   = useState<string | null>(null);
  const [timeSlots, setTimeSlots]         = useState<TimeSlotWithProgram[]>([]);
  const [selectedSlot, setSelectedSlot]   = useState<TimeSlotWithProgram | null>(null);
  const [loading, setLoading]             = useState(false);
  const [customerInfo, setCustomerInfo]   = useState({ name: "", email: "", phone: "", notes: "" });
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId]         = useState("");
  const [error, setError]                 = useState("");

  // Fetch program list on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPrograms();
        setPrograms(res.data);
        if (programQuery) {
          const match = res.data.find(
            (p) => p.category === programQuery ||
                   p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === programQuery
          );
          if (match) { setSelectedProgram(match); setStep(2); }
        }
      } catch { setPrograms([]); }
    };
    load();
  }, [programQuery]);

  // Fetch available + blocked dates whenever month changes (all-programs, matches admin)
  const fetchDates = useCallback(async () => {
    try {
      const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,"0")}`;
      const [availRes, blockedRes] = await Promise.all([
        getAvailableDates(undefined, monthStr),
        getBlockedDatesForMonth(monthStr),
      ]);
      setAvailableDates(availRes.data);
      setBlockedDates(blockedRes.data.blockedDates);
      setBlockReasons(blockedRes.data.blockReasons || {});
    } catch {
      setAvailableDates([]); setBlockedDates([]); setBlockReasons({});
    }
  }, [currentMonth]);

  useEffect(() => { fetchDates(); }, [fetchDates]);

  // Fetch ALL slots for the selected date (all programs) so user sees every option
  useEffect(() => {
    if (!selectedDate) return;
    const load = async () => {
      try {
        const res = await getAvailableSlots(selectedDate);
        setTimeSlots(res.data);
      } catch { setTimeSlots([]); }
    };
    load();
  }, [selectedDate]);

  // Preload Razorpay on step 3 so it's ready by payment step
  useEffect(() => {
    if (step !== 3) return;
    if ((window as unknown as Record<string, unknown>).Razorpay) return;
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.head.appendChild(s);
  }, [step]);

  const handlePayment = async () => {
    if (!selectedSlot) return;
    const prog = selectedSlot.program;
    setLoading(true); setError("");
    try {
      const orderRes = await createPaymentOrder({
        amount: prog.price, currency: prog.currency,
        programName: prog.name, customerEmail: customerInfo.email,
      });
      const { orderId, amount, currency, keyId } = orderRes.data;

      if (!(window as unknown as Record<string, unknown>).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.head.appendChild(s);
        });
      }

      const RazorpayConstructor = (window as unknown as Record<string, unknown>).Razorpay as
        new (o: Record<string, unknown>) => { open: () => void };

      const rzp = new RazorpayConstructor({
        key: keyId, amount, currency,
        name: "Cole Studio", description: prog.name, order_id: orderId,
        prefill: { name: customerInfo.name, email: customerInfo.email, contact: customerInfo.phone },
        theme: { color: "#C9A84C" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyPayment({
              razorpay_order_id:    response.razorpay_order_id,
              razorpay_payment_id:  response.razorpay_payment_id,
              razorpay_signature:   response.razorpay_signature,
            });
            const bookingRes = await createBooking({
              customerName:  customerInfo.name,
              customerEmail: customerInfo.email,
              customerPhone: customerInfo.phone,
              programId:     prog._id,
              timeSlotId:    selectedSlot._id,
              amount:        prog.price,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              notes: customerInfo.notes,
            });
            setBookingId(bookingRes.data._id);
            setBookingComplete(true);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            if (msg.includes("just been booked") || msg.includes("409")) {
              setError("This slot was just booked by someone else. Please pick another.");
              setSelectedSlot(null); setStep(2);
            } else {
              setError("Payment verified but booking failed. Please contact support.");
            }
          }
          setLoading(false);
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch {
      setError("Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) =>
    `${currency === "INR" ? "₹" : "$"}${(price / 100).toLocaleString()}`;

  // ---- Booking Confirmation screen ----
  if (bookingComplete) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="min-h-[60vh] flex flex-col items-center justify-center text-center py-20 px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
          <CheckCircle size={64} className="text-primary mb-6" />
        </motion.div>
        <h2 className="heading-display mb-4" style={{ fontSize: "clamp(1.5rem,3vw,2.5rem)" }}>
          Booking Confirmed!
        </h2>
        <p className="body-muted max-w-md mb-2">
          Your session has been booked. A confirmation email will be sent to{" "}
          <strong className="text-foreground">{customerInfo.email}</strong>.
        </p>
        {bookingId && (
          <p className="text-muted-foreground text-xs mt-2 mb-8">Booking ID: {bookingId}</p>
        )}
        <div className="bg-card border border-border p-6 max-w-sm w-full mb-8 text-left">
          <h4 className="section-label mb-4" style={{ fontSize: "0.65rem" }}>Booking Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Program</span>
              <span className="text-foreground">{selectedSlot?.program.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="text-foreground">{selectedSlot?.startTime} – {selectedSlot?.endTime}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-2">
              <span className="text-muted-foreground font-medium">Total</span>
              <span className="text-primary font-medium">
                {selectedSlot ? formatPrice(selectedSlot.program.price, selectedSlot.program.currency) : ""}
              </span>
            </div>
          </div>
        </div>
        <a href="/"
          className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary-hover
                     transition-colors duration-300 uppercase text-xs font-medium inline-block"
          style={{ letterSpacing: "0.2em" }}>
          Back to Home
        </a>
      </motion.div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone   = step > s.num;
          return (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isActive ? "border-primary bg-primary text-primary-foreground"
                  : isDone  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"}`}>
                  {isDone ? <CheckCircle size={16} /> : <Icon size={16} />}
                </div>
                <span className={`text-xs mt-2 hidden md:block ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  style={{ letterSpacing: "0.05em" }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 md:w-20 h-px mx-2 transition-colors ${isDone ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 mb-6 text-sm rounded">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ===== STEP 1: Select Program ===== */}
        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>

            <h2 className="heading-display mb-2" style={{ fontSize: "clamp(1.5rem,3vw,2rem)" }}>
              Choose Your Program
            </h2>
            <p className="body-muted mb-8">Select the service you&apos;d like to book.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((program) => {
                const Icon = iconMap[program.icon] || Film;
                const isSelected = selectedProgram?._id === program._id;
                return (
                  <button key={program._id}
                    onClick={() => setSelectedProgram(isSelected ? null : program)}
                    className={`text-left p-6 border transition-all duration-300 group ${
                      isSelected ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-card-hover"}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? "border-primary" : "border-border group-hover:border-primary"}`}>
                        <Icon size={20} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-foreground font-medium mb-1">{program.name}</h3>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{program.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-primary font-medium">
                            {formatPrice(program.price, program.currency)}
                          </span>
                          <span className="text-muted-foreground text-xs">{program.duration}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {programs.length === 0 && (
              <div className="text-center py-16 border border-border">
                <p className="text-muted-foreground mb-2">Unable to load programs.</p>
                <p className="text-muted-foreground text-sm">Make sure the backend server is running on port 5000.</p>
              </div>
            )}

            <div className="flex justify-end mt-8">
              <button onClick={() => selectedProgram && setStep(2)} disabled={!selectedProgram}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground
                           hover:bg-primary-hover transition-colors uppercase text-xs font-medium
                           disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ letterSpacing: "0.15em" }}>
                Next <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ===== STEP 2: Date & Time ===== */}
        {step === 2 && (
          <motion.div key="step2"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>

            <h2 className="heading-display mb-2" style={{ fontSize: "clamp(1.5rem,3vw,2rem)" }}>
              Pick Date &amp; Time
            </h2>
            <p className="body-muted mb-8">
              Available dates are marked with a green dot. Select a date to see time slots.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Calendar */}
              <div className="border border-border p-6">
                <SimpleCalendar
                  availableDates={availableDates}
                  blockedDates={blockedDates}
                  blockReasons={blockReasons}
                  selectedDate={selectedDate}
                  onSelectDate={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Available
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> Unavailable
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="border border-border p-6">
                <h3 className="section-label mb-4" style={{ fontSize: "0.65rem" }}>
                  <Clock size={12} className="inline mr-2" />
                  {selectedDate ? `Available Slots — ${selectedDate}` : "Select a date first"}
                </h3>

                {selectedDate && timeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {timeSlots.map((slot) => (
                      <button key={slot._id} onClick={() => setSelectedSlot(slot)}
                        className={`p-4 border text-left transition-all duration-200 ${
                          selectedSlot?._id === slot._id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock size={14} className="text-primary" />
                            <div>
                              <span className="text-foreground font-medium block">
                                {slot.startTime} — {slot.endTime}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {slot.program.name} · {formatPrice(slot.program.price, slot.program.currency)}
                              </span>
                            </div>
                          </div>
                          {selectedSlot?._id === slot._id && (
                            <CheckCircle size={16} className="text-primary flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">
                    No available slots for this date.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm py-8 text-center">
                    Pick a date from the calendar to see time slots.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-3 border border-border text-foreground
                           hover:border-primary transition-colors uppercase text-xs"
                style={{ letterSpacing: "0.15em" }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={() => selectedSlot && setStep(3)} disabled={!selectedSlot}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground
                           hover:bg-primary-hover transition-colors uppercase text-xs font-medium
                           disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ letterSpacing: "0.15em" }}>
                Next <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ===== STEP 3: Customer Details ===== */}
        {step === 3 && (
          <motion.div key="step3"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>

            <h2 className="heading-display mb-2" style={{ fontSize: "clamp(1.5rem,3vw,2rem)" }}>
              Your Details
            </h2>
            <p className="body-muted mb-8">Tell us who you are so we can confirm your booking.</p>

            <div className="max-w-lg space-y-5">
              {[
                { label: "Full Name *",     type: "text",  key: "name",  placeholder: "Your full name" },
                { label: "Email *",         type: "email", key: "email", placeholder: "your@email.com" },
                { label: "Phone *",         type: "tel",   key: "phone", placeholder: "+91 98765 43210" },
              ].map(({ label, type, key, placeholder }) => (
                <div key={key}>
                  <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                    {label}
                  </label>
                  <input type={type} required placeholder={placeholder}
                    className="w-full bg-input border border-border text-foreground px-4 py-3
                               focus:outline-none focus:border-primary transition-colors
                               placeholder-muted-foreground text-sm"
                    value={customerInfo[key as keyof typeof customerInfo]}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="section-label block mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                  Notes (Optional)
                </label>
                <textarea rows={3} placeholder="Any special requests or notes..."
                  className="w-full bg-input border border-border text-foreground px-4 py-3
                             focus:outline-none focus:border-primary transition-colors
                             placeholder-muted-foreground text-sm resize-none"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 border border-border text-foreground
                           hover:border-primary transition-colors uppercase text-xs"
                style={{ letterSpacing: "0.15em" }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={() => { if (customerInfo.name && customerInfo.email && customerInfo.phone) setStep(4); }}
                disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground
                           hover:bg-primary-hover transition-colors uppercase text-xs font-medium
                           disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ letterSpacing: "0.15em" }}>
                Next <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ===== STEP 4: Payment ===== */}
        {step === 4 && (
          <motion.div key="step4"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>

            <h2 className="heading-display mb-2" style={{ fontSize: "clamp(1.5rem,3vw,2rem)" }}>
              Confirm &amp; Pay
            </h2>
            <p className="body-muted mb-8">Review your booking details and proceed to payment.</p>

            <div className="max-w-lg border border-border p-6 mb-8">
              <h3 className="section-label mb-6" style={{ fontSize: "0.65rem" }}>Booking Summary</h3>
              <div className="space-y-4">
                {[
                  { label: "Program",  value: selectedSlot?.program.name },
                  { label: "Date",     value: selectedDate },
                  { label: "Time",     value: `${selectedSlot?.startTime} — ${selectedSlot?.endTime}` },
                  { label: "Duration", value: selectedSlot?.program.duration },
                  { label: "Name",     value: customerInfo.name },
                  { label: "Email",    value: customerInfo.email },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">{label}</span>
                    <span className="text-foreground text-sm font-medium">{value}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-4 mt-4 flex justify-between items-center">
                  <span className="text-foreground font-medium">Total</span>
                  <span className="text-primary text-xl font-medium" style={{ fontFamily: "var(--font-serif)" }}>
                    {selectedSlot ? formatPrice(selectedSlot.program.price, selectedSlot.program.currency) : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-3 border border-border text-foreground
                           hover:border-primary transition-colors uppercase text-xs"
                style={{ letterSpacing: "0.15em" }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={handlePayment} disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground
                           hover:bg-primary-hover transition-colors uppercase text-xs font-medium
                           disabled:opacity-50"
                style={{ letterSpacing: "0.15em" }}>
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
                  : <><CreditCard size={14} /> Pay Now</>}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ---- Page wrapper ----
export default function BookingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <div className="pt-24">
        <div className="max-w-5xl mx-auto px-6 md:px-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="gold-line" />
            <span className="section-label">Book a Session</span>
          </div>
          <h1 className="heading-display" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
            Reserve Your<br />Studio Time.
          </h1>
        </div>
        <Suspense fallback={<div className="py-32 text-center text-muted-foreground text-sm">Loading...</div>}>
          <BookingContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
