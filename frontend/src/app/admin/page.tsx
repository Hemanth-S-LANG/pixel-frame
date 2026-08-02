"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminNav } from "@/components/layout/AdminNav";
import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon, Clock, Users, DollarSign, Ban, Check,
  ChevronLeft, ChevronRight, Lock, Unlock, Loader2, AlertTriangle,
  User, Mail, Phone, FileText, X, Search, ChevronDown, CheckCircle,
  Eye, EyeOff, Pencil, Plus, Trash2
} from "lucide-react";
import {
  adminLogin, adminGetStats, adminGetSlots, adminBlockDate, adminUnblockDate,
  adminBlockSlot, adminUnblockSlot, adminGetBookings,
  getBlockedDatesForMonth, adminUpdateSlot, getPrograms,
  adminCreateSlot, adminDeleteSlot, adminGetAvailableDates,
  type AdminSlot, type AdminStats, type Booking, type Program,
} from "@/lib/api";

export default function AdminPage() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  
  // Bookings list states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [limitPerPage, setLimitPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDetailedBooking, setSelectedDetailedBooking] = useState<Booking | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Calendar states
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Block reason modal state
  const [blockModal, setBlockModal] = useState<{
    type: "date" | "slot";
    slot?: AdminSlot;
  } | null>(null);
  const [blockModalReason, setBlockModalReason] = useState("");
  
  // Slot editing states
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editProgram, setEditProgram] = useState("");
  const [isCustomProgram, setIsCustomProgram] = useState(false);
  const [customProgramName, setCustomProgramName] = useState("");

  // Programs list for the program selector in edit mode
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);

  // Slot filtering and creation states
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("all");
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlotStartTime, setNewSlotStartTime] = useState("");
  const [newSlotEndTime, setNewSlotEndTime] = useState("");
  const [newSlotProgram, setNewSlotProgram] = useState("");
  const [newSlotIsCustomProgram, setNewSlotIsCustomProgram] = useState(false);
  const [newSlotCustomProgramName, setNewSlotCustomProgramName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<"calendar" | "bookings">("calendar");

  // Show toast message
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Force login on refresh by removing the token on mount
  useEffect(() => {
    localStorage.removeItem("admin_token");
    setIsLoggedIn(false);
  }, []);

  // Fetch stats, calendar dates, and programs once logged in
  useEffect(() => {
    if (isLoggedIn) {
      adminGetStats()
        .then((res) => setStats(res.data))
        .catch((err) => {
          console.error("Stats fetch failed:", err);
          if (err.message?.includes("401") || err.message?.includes("403") || err.message?.includes("token")) {
            handleLogout();
          }
        });
      getPrograms()
        .then((res) => {
          setAllPrograms(res.data);
          if (res.data.length > 0) {
            setNewSlotProgram(res.data[0]._id);
          }
        })
        .catch(() => setAllPrograms([]));
    }
  }, [isLoggedIn]);

  // Fetch blocked and available dates for calendar
  const fetchBlockedDates = useCallback(async () => {
    if (!isLoggedIn) return;
    const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
    try {
      const [blockedRes, availableRes] = await Promise.all([
        getBlockedDatesForMonth(monthStr),
        adminGetAvailableDates(monthStr),
      ]);
      setBlockedDates(blockedRes.data.blockedDates);
      setAvailableDates(availableRes.data);
    } catch {
      setBlockedDates([]);
      setAvailableDates([]);
    }
  }, [currentMonth, isLoggedIn]);

  useEffect(() => {
    fetchBlockedDates();
  }, [fetchBlockedDates]);

  // Fetch slots when a date is selected
  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !isLoggedIn) return;
    setLoading(true);
    try {
      const res = await adminGetSlots(selectedDate);
      setSlots(res.data);
    } catch {
      setSlots([]);
    }
    setLoading(false);
  }, [selectedDate, isLoggedIn]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Fetch bookings with pagination and filters
  const fetchBookings = useCallback(async () => {
    if (!isLoggedIn) return;
    setBookingsLoading(true);
    try {
      // Backend does not filter by search term directly via query, so we'll fetch list and filter or query accordingly.
      // Since backend adminGetBookings takes page and limit, we can query it.
      const res = await adminGetBookings(currentPage, limitPerPage);
      setBookings(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalBookingsCount(res.pagination.total || 0);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
    setBookingsLoading(false);
  }, [currentPage, limitPerPage, isLoggedIn]);

  useEffect(() => {
    if (activeTab === "bookings") {
      fetchBookings();
    }
  }, [activeTab, fetchBookings]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await adminLogin({
        username: usernameInput,
        password: passwordInput
      });
      localStorage.setItem("admin_token", res.data.token);
      setUsernameInput("");
      setPasswordInput("");
      setIsLoggedIn(true);
      showToast("Welcome back, Marcus!");
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsLoggedIn(false);
    setStats(null);
    setBookings([]);
    setSlots([]);
    showToast("Logged out successfully");
  };

  // Auto-logout after 5 minutes of inactivity
  useEffect(() => {
    if (!isLoggedIn) return;

    let inactivityTimeout: NodeJS.Timeout;

    const resetTimer = () => {
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        handleLogout();
        showToast("Logged out due to 5 minutes of inactivity");
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Initialize timer
    resetTimer();

    const activityEvents = ["mousemove", "keydown", "click", "scroll"];
    
    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isLoggedIn]);

  // Block entire date — opens modal to optionally enter reason
  const handleBlockDate = () => {
    if (!selectedDate) return;
    setBlockModalReason("");
    setBlockModal({ type: "date" });
  };

  // Confirm block date (called from modal)
  const confirmBlockDate = async (reason: string) => {
    if (!selectedDate) return;
    setBlockModal(null);
    setActionLoading("block-date");
    try {
      const res = await adminBlockDate({ date: selectedDate, reason: reason.trim() || undefined });
      showToast(`Blocked ${res.data.blockedSlots} slots for ${selectedDate}`);
      await fetchSlots();
      await fetchBlockedDates();
      adminGetStats().then((r) => setStats(r.data)).catch(() => {});
    } catch {
      showToast("Failed to block date");
    }
    setActionLoading("");
  };

  // Unblock entire date
  const handleUnblockDate = async () => {
    if (!selectedDate) return;
    setActionLoading("unblock-date");
    try {
      const res = await adminUnblockDate({ date: selectedDate });
      showToast(`Unblocked slots for ${selectedDate}`);
      await fetchSlots();
      await fetchBlockedDates();
      adminGetStats().then((r) => setStats(r.data)).catch(() => {});
    } catch {
      showToast("Failed to unblock date");
    }
    setActionLoading("");
  };

  // Block individual slot — opens modal to optionally enter reason
  const handleToggleSlot = (slot: AdminSlot) => {
    if (slot.isBooked && slot.currentBookings === 0) {
      // Unblock: no reason needed, do it immediately
      confirmUnblockSlot(slot._id);
    } else if (!slot.isBooked) {
      // Block: open modal
      setBlockModalReason("");
      setBlockModal({ type: "slot", slot });
    }
  };

  const confirmUnblockSlot = async (slotId: string) => {
    setActionLoading(slotId);
    try {
      await adminUnblockSlot({ slotId });
      showToast("Slot unblocked");
      await fetchSlots();
      await fetchBlockedDates();
    } catch {
      showToast("Failed to unblock slot");
    }
    setActionLoading("");
  };

  // Confirm block slot (called from modal)
  const confirmBlockSlot = async (slot: AdminSlot, reason: string) => {
    setBlockModal(null);
    setActionLoading(slot._id);
    try {
      await adminBlockSlot({ slotId: slot._id, reason: reason.trim() || undefined });
      showToast("Slot blocked");
      await fetchSlots();
      await fetchBlockedDates();
    } catch {
      showToast("Failed to block slot");
    }
    setActionLoading("");
  };
  // Delete slot permanently
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to permanently delete this timeslot?")) return;
    setActionLoading(`delete-${slotId}`);
    try {
      await adminDeleteSlot(slotId);
      showToast("Slot deleted successfully");
      await fetchSlots();
      await fetchBlockedDates();
      adminGetStats().then((r) => setStats(r.data)).catch(() => {});
    } catch (err: any) {
      showToast(err.message || "Failed to delete slot");
    }
    setActionLoading("");
  };

  // Create slot from the form inputs
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    
    const programValue = newSlotIsCustomProgram 
      ? newSlotCustomProgramName.trim() 
      : newSlotProgram;

    if (!programValue) {
      showToast("Please select or enter a program");
      return;
    }
    if (!newSlotStartTime || !newSlotEndTime) {
      showToast("Start and end times are required");
      return;
    }

    setActionLoading("create-slot");
    try {
      await adminCreateSlot({
        date: selectedDate,
        startTime: newSlotStartTime,
        endTime: newSlotEndTime,
        program: programValue,
      });
      showToast("Slot created successfully");
      setIsAddingSlot(false);
      setNewSlotStartTime("");
      setNewSlotEndTime("");
      setNewSlotCustomProgramName("");
      await fetchSlots();
      await fetchBlockedDates();
      adminGetStats().then((r) => setStats(r.data)).catch(() => {});
    } catch (err: any) {
      showToast(err.message || "Failed to create slot");
    }
    setActionLoading("");
  };

  // Start editing a slot
  const handleStartEdit = (slot: AdminSlot) => {
    setEditingSlotId(slot._id);
    setEditStartTime(slot.startTime);
    setEditEndTime(slot.endTime);
    const programId = typeof slot.program === "object" && "_id" in slot.program
      ? slot.program._id
      : String(slot.program);
    setEditProgram(programId);
    setIsCustomProgram(false);
    setCustomProgramName("");
  };

  // Save edited slot (times + program)
  const handleUpdateSlot = async () => {
    if (!editingSlotId) return;
    setActionLoading(`edit-${editingSlotId}`);
    try {
      const updateData: { startTime: string; endTime: string; program?: string } = {
        startTime: editStartTime,
        endTime: editEndTime,
      };
      
      if (isCustomProgram) {
        if (!customProgramName.trim()) {
          showToast("Please enter a program name");
          setActionLoading("");
          return;
        }
        updateData.program = customProgramName.trim();
      } else {
        // Only send program if it was changed
        const currentSlot = slots.find((s) => s._id === editingSlotId);
        const currentProgramId = currentSlot && typeof currentSlot.program === "object" && "_id" in currentSlot.program
          ? currentSlot.program._id
          : String(currentSlot?.program);
        if (editProgram && editProgram !== currentProgramId) {
          updateData.program = editProgram;
        }
      }
      
      await adminUpdateSlot(editingSlotId, updateData);
      showToast("Slot updated successfully");
      setEditingSlotId(null);
      await fetchSlots();
    } catch (err: any) {
      showToast(err.message || "Failed to update slot");
    }
    setActionLoading("");
  };

  const formatPrice = (amount: number) => `₹${(amount / 100).toLocaleString()}`;

  // Filter bookings locally if there is a search term
  const filteredBookings = bookings.filter((b) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const matchesName  = b.customerName?.toLowerCase().includes(s);
    const matchesEmail = b.customerEmail?.toLowerCase().includes(s);
    const matchesPhone = b.customerPhone?.toLowerCase().includes(s);
    const programName  = b.program && typeof b.program === "object" && "name" in b.program
      ? (b.program as { name: string }).name.toLowerCase()
      : "";
    const matchesProgram = programName.includes(s);
    return matchesName || matchesEmail || matchesPhone || matchesProgram;
  });

  // Calendar parameters
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  // ---- Login View ----
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-background flex flex-col justify-center items-center px-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        
        <div className="w-full max-w-md border border-border bg-card/40 backdrop-blur-md p-8 md:p-10 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-foreground uppercase text-base mb-1" style={{ fontFamily: "var(--font-serif)", letterSpacing: "0.3em" }}>
              Marcus <span className="text-primary font-bold">Cole</span>
            </h2>
            <div className="w-12 h-[1px] bg-primary mx-auto my-3" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Admin Portal Gate</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="section-label block mb-2" style={{ fontSize: "0.6rem" }}>Username</label>
              <input
                type="text"
                required
                className="w-full bg-input border border-border text-foreground px-4 py-3
                           focus:outline-none focus:border-primary transition-colors text-sm"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="admin"
              />
            </div>

            <div>
              <label className="section-label block mb-2" style={{ fontSize: "0.6rem" }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="w-full bg-input border border-border text-foreground pl-4 pr-12 py-3
                             focus:outline-none focus:border-primary transition-colors text-sm"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-destructive text-xs border border-destructive/20 bg-destructive/5 p-3">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold
                         transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Verifying Key...
                </>
              ) : (
                "Authorize Access"
              )}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ---- Main Admin Dashboard View ----
  return (
    <main className="min-h-screen bg-background">
      <AdminNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <div className="pt-28 md:pt-32 pb-16 max-w-7xl mx-auto px-6 md:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="gold-line" />
          <span className="section-label">Studio Controls</span>
        </div>
        <h1 className="heading-display mb-8" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}>
          {activeTab === "calendar" ? "Availability Calendar" : "Studio Booking Records"}
        </h1>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-24 right-6 z-50 bg-primary text-primary-foreground px-5 py-3 text-sm shadow-xl font-medium border border-primary/20"
              style={{ letterSpacing: "0.05em" }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Total Bookings", value: stats.totalBookings, icon: Users },
              { label: "Today\u0027s Bookings", value: stats.todayBookings, icon: CalendarIcon },
              { label: "Total Revenue", value: formatPrice(stats.totalRevenue), icon: DollarSign },
              { label: "Active Programs", value: stats.totalPrograms, icon: Clock },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-card/30 backdrop-blur-sm border border-border p-5 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 border border-border flex items-center justify-center bg-background/55">
                      <Icon size={14} className="text-primary" />
                    </div>
                    <span className="section-label" style={{ fontSize: "0.55rem" }}>{s.label}</span>
                  </div>
                  <div className="text-foreground text-xl font-medium" style={{ fontFamily: "var(--font-serif)" }}>
                    {s.value}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Calendar and Slot Management */}
        {activeTab === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2 border border-border bg-card/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <ChevronLeft size={18} />
                </button>
                <h3 className="text-foreground text-sm font-medium tracking-widest uppercase">
                  {monthNames[month]} {year}
                </h3>
                <button
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((d) => (
                  <div key={d} className="text-center text-muted-foreground text-xs py-1 font-semibold">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isBlocked = blockedDates.includes(dateStr);
                  const isAvailable = availableDates.includes(dateStr);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`
                        relative h-11 flex items-center justify-center text-sm transition-all duration-200 rounded-sm
                        ${isSelected ? "bg-primary text-primary-foreground font-semibold" : ""}
                        ${isBlocked && !isSelected ? "bg-destructive/10 text-destructive border border-destructive/20" : ""}
                        ${!isBlocked && !isSelected ? "text-foreground hover:bg-card/80 border border-transparent" : ""}
                      `}
                    >
                      {day}
                      {isBlocked && !isSelected && (
                        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-destructive" />
                      )}
                      {!isBlocked && isAvailable && !isSelected && (
                        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> Available
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-destructive" /> Blocked / Leave
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Active Selection
                </div>
              </div>
            </div>

            {/* Slot Management Panel */}
            <div className="lg:col-span-3 border border-border p-6 bg-card/5">
              {selectedDate ? (
                <div>
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b border-border pb-4">
                    <div>
                      <h3 className="text-foreground font-semibold">
                        Slots for <span className="text-primary">{selectedDate}</span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">Configure slot blockage and leaves below.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsAddingSlot(!isAddingSlot)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20
                                   text-xs uppercase hover:bg-primary hover:text-primary-foreground transition-colors"
                        style={{ letterSpacing: "0.1em" }}
                      >
                        <Plus size={12} />
                        Add Slot
                      </button>
                      <button
                        onClick={handleBlockDate}
                        disabled={actionLoading === "block-date"}
                        className="flex items-center gap-2 px-4 py-2 bg-destructive/15 text-destructive border border-destructive/20
                                   text-xs uppercase hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
                        style={{ letterSpacing: "0.1em" }}
                      >
                        {actionLoading === "block-date" ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                        Block Day
                      </button>
                      <button
                        onClick={handleUnblockDate}
                        disabled={actionLoading === "unblock-date"}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20
                                   text-xs uppercase hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                        style={{ letterSpacing: "0.1em" }}
                      >
                        {actionLoading === "unblock-date" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Unblock Day
                      </button>
                    </div>
                  </div>

                  {/* Add Slot Form */}
                  {isAddingSlot && (
                    <form onSubmit={handleCreateSlot} className="mb-6 p-4 border border-primary/30 bg-primary/5 rounded-sm">
                      <h4 className="text-foreground text-xs font-semibold uppercase tracking-wider mb-4" style={{ letterSpacing: "0.05em" }}>
                        Add New Slot
                      </h4>
                      <div className="space-y-4">
                        {/* Program Select */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block"
                              style={{ fontSize: "0.55rem" }}
                            >
                              Program
                            </label>
                            <button
                              type="button"
                              onClick={() => setNewSlotIsCustomProgram(!newSlotIsCustomProgram)}
                              className="text-primary hover:text-primary-hover text-[10px] uppercase font-semibold transition-colors"
                            >
                              {newSlotIsCustomProgram ? "Select Existing" : "Type Custom"}
                            </button>
                          </div>
                          
                          {newSlotIsCustomProgram ? (
                            <input
                              type="text"
                              required
                              placeholder="Enter custom program name (e.g. Filmography)"
                              className="w-full bg-input border border-border text-foreground px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
                              value={newSlotCustomProgramName}
                              onChange={(e) => setNewSlotCustomProgramName(e.target.value)}
                            />
                          ) : (
                            <select
                              className="w-full bg-input border border-border text-foreground px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
                              value={newSlotProgram}
                              onChange={(e) => setNewSlotProgram(e.target.value)}
                            >
                              {allPrograms.map((p) => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Times */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block mb-1.5"
                              style={{ fontSize: "0.55rem" }}
                            >
                              Start Time (HH:MM)
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="09:00"
                              className="w-full bg-input border border-border text-foreground px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
                              value={newSlotStartTime}
                              onChange={(e) => setNewSlotStartTime(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block mb-1.5"
                              style={{ fontSize: "0.55rem" }}
                            >
                              End Time (HH:MM)
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="14:00"
                              className="w-full bg-input border border-border text-foreground px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
                              value={newSlotEndTime}
                              onChange={(e) => setNewSlotEndTime(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            disabled={actionLoading === "create-slot"}
                            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary-hover text-xs uppercase font-semibold transition-colors flex items-center gap-1"
                            style={{ letterSpacing: "0.05em" }}
                          >
                            {actionLoading === "create-slot" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Save Slot
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingSlot(false)}
                            className="px-4 py-2 border border-border text-muted-foreground hover:text-foreground text-xs uppercase font-semibold transition-colors"
                            style={{ letterSpacing: "0.05em" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Filter and slots header */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2 border-t border-border pt-4">
                    <label className="section-label block" style={{ fontSize: "0.6rem" }}>
                      <Clock size={12} className="inline mr-2" />
                      List of Slots
                    </label>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Filter Program:</span>
                      <select
                        className="bg-input border border-border px-2 py-1 text-foreground focus:outline-none focus:border-primary text-xs"
                        value={selectedProgramFilter}
                        onChange={(e) => setSelectedProgramFilter(e.target.value)}
                      >
                        <option value="all">All Programs</option>
                        {allPrograms.map((p) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Slots list */}
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="animate-spin text-primary" size={28} />
                    </div>
                  ) : slots.length > 0 ? (
                    <div className="space-y-3">
                      {slots
                        .filter((slot) => {
                          if (selectedProgramFilter === "all") return true;
                          const programId = typeof slot.program === "object" && "_id" in slot.program
                            ? slot.program._id
                            : String(slot.program);
                          return programId === selectedProgramFilter;
                        })
                        .map((slot) => {
                        const programName = typeof slot.program === "object" && "name" in slot.program
                          ? slot.program.name
                          : "Unknown Program";
                        const hasRealBooking = slot.currentBookings > 0;
                        const isAdminBlocked = slot.isBooked && !hasRealBooking;

                        const isEditing = editingSlotId === slot._id;

                        return (
                          <div
                            key={slot._id}
                            className={`flex items-center justify-between p-4 border transition-all duration-300 ${
                              hasRealBooking
                                ? "border-primary/25 bg-primary/5"
                                : isAdminBlocked
                                  ? "border-destructive/25 bg-destructive/5"
                                  : "border-border hover:border-primary/20 hover:bg-card/20"
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-3 w-full">
                                {/* Program selector */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block"
                                      style={{ fontSize: "0.55rem" }}
                                    >
                                      Program
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setIsCustomProgram(!isCustomProgram)}
                                      className="text-primary hover:text-primary-hover text-[10px] uppercase font-semibold transition-colors"
                                    >
                                      {isCustomProgram ? "Select Existing" : "Type Custom"}
                                    </button>
                                  </div>
                                  
                                  {isCustomProgram ? (
                                    <input
                                      type="text"
                                      placeholder="Enter program name (e.g. Filmography)"
                                      className="w-full bg-input border border-border text-foreground px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
                                      value={customProgramName}
                                      onChange={(e) => setCustomProgramName(e.target.value)}
                                    />
                                  ) : (
                                    <select
                                      className="w-full bg-input border border-border text-foreground px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
                                      value={editProgram}
                                      onChange={(e) => setEditProgram(e.target.value)}
                                    >
                                      {allPrograms.map((p) => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>

                                {/* Time inputs */}
                                <div>
                                  <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block mb-1.5"
                                    style={{ fontSize: "0.55rem" }}
                                  >
                                    Time Range <span className="text-muted-foreground/60 font-normal">(HH:MM 24-hour)</span>
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      className="w-24 bg-input border border-border text-foreground px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                                      value={editStartTime}
                                      onChange={(e) => setEditStartTime(e.target.value)}
                                      placeholder="Start (e.g. 09:00)"
                                    />
                                    <span className="text-muted-foreground text-xs">—</span>
                                    <input
                                      type="text"
                                      className="w-24 bg-input border border-border text-foreground px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                                      value={editEndTime}
                                      onChange={(e) => setEditEndTime(e.target.value)}
                                      placeholder="End (e.g. 14:00)"
                                    />
                                  </div>
                                </div>

                                {/* Save / Cancel */}
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={handleUpdateSlot}
                                    disabled={actionLoading === `edit-${slot._id}`}
                                    className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground text-xs uppercase font-semibold transition-colors flex items-center gap-1"
                                    style={{ letterSpacing: "0.05em", fontSize: "0.55rem" }}
                                  >
                                    {actionLoading === `edit-${slot._id}` ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingSlotId(null)}
                                    className="px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground text-xs uppercase font-semibold transition-colors"
                                    style={{ letterSpacing: "0.05em", fontSize: "0.55rem" }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-4">
                                  <div className={`w-8 h-8 flex items-center justify-center border bg-background/80 ${
                                    hasRealBooking
                                      ? "border-primary text-primary"
                                      : isAdminBlocked
                                        ? "border-destructive text-destructive"
                                        : "border-border text-green-500"
                                  }`}>
                                    {hasRealBooking ? (
                                      <Users size={14} />
                                    ) : isAdminBlocked ? (
                                      <Lock size={14} />
                                    ) : (
                                      <Unlock size={14} />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-foreground text-sm font-semibold">
                                      {slot.startTime} — {slot.endTime}
                                    </div>
                                    <div className="text-muted-foreground text-xs">{programName}</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-2 py-0.5 text-xs font-semibold ${
                                      hasRealBooking
                                        ? "bg-primary/10 text-primary"
                                        : isAdminBlocked
                                          ? "bg-destructive/10 text-destructive"
                                          : "bg-green-500/10 text-green-500"
                                    }`}
                                    style={{ letterSpacing: "0.05em", fontSize: "0.6rem" }}
                                  >
                                    {hasRealBooking
                                      ? `Booked (${slot.currentBookings}/${slot.maxBookings})`
                                      : isAdminBlocked
                                        ? slot.blockReason || "Blocked"
                                        : "Available"}
                                  </span>

                                  {!hasRealBooking && (
                                    <>
                                      <button
                                        onClick={() => handleStartEdit(slot)}
                                        className="p-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                                        title="Edit slot times"
                                      >
                                        <Pencil size={12} />
                                      </button>
 
                                      <button
                                        onClick={() => handleToggleSlot(slot)}
                                        disabled={actionLoading === slot._id}
                                        className={`px-3 py-1.5 text-xs uppercase font-medium transition-colors disabled:opacity-50 ${
                                          isAdminBlocked
                                            ? "border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white"
                                            : "border border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                                        }`}
                                        style={{ letterSpacing: "0.05em", fontSize: "0.55rem" }}
                                      >
                                        {actionLoading === slot._id ? (
                                          <Loader2 size={10} className="animate-spin" />
                                        ) : isAdminBlocked ? (
                                          "Unblock"
                                        ) : (
                                          "Block"
                                        )}
                                      </button>

                                      <button
                                        onClick={() => handleDeleteSlot(slot._id)}
                                        disabled={actionLoading === `delete-${slot._id}`}
                                        className="p-1.5 border border-border text-destructive/80 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center justify-center"
                                        title="Delete slot permanently"
                                      >
                                        {actionLoading === `delete-${slot._id}` ? (
                                          <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                          <Trash2 size={12} />
                                        )}
                                      </button>
                                    </>
                                  )}
                                  {hasRealBooking && (
                                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                                      <AlertTriangle size={12} className="text-primary/70" />
                                      Locked
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 border border-border border-dashed text-muted-foreground text-sm">
                      No slots generated for this date. Make sure the database seeds correctly.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center border border-border border-dashed">
                  <CalendarIcon size={36} className="text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                    Select a date from the calendar to modify its slot availability status.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings View Tab with detailed columns, expandable rows, and pagination */}
        {activeTab === "bookings" && (
          <div className="border border-border p-6 bg-card/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-border pb-6">
              <div>
                <h3 className="text-foreground font-semibold">User Booking Logs</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Showing {totalBookingsCount} bookings in total. Click on any record to view comprehensive details.
                </p>
              </div>

              {/* Search input and page limit selector */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    className="pl-9 pr-4 py-2 bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary w-60"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Show</span>
                  <select
                    className="bg-input border border-border px-2 py-1.5 text-foreground focus:outline-none focus:border-primary text-xs"
                    value={limitPerPage}
                    onChange={(e) => {
                      setLimitPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    {[10, 20, 50].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {bookingsLoading ? (
              <div className="flex items-center justify-center py-28">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-semibold uppercase tracking-wider bg-card/20">
                        <th className="py-3.5 px-4">Customer Details</th>
                        <th className="py-3.5 px-4">Selected Program</th>
                        <th className="py-3.5 px-4">Scheduled Date</th>
                        <th className="py-3.5 px-4">Slot Time</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Payment Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b) => {
                        const pName = b.program && typeof b.program === "object" && "name" in b.program
                          ? (b.program as { name: string }).name
                          : "-";
                        const slot = b.timeSlot;
                        const formattedTime = typeof slot === "object" && slot && "startTime" in slot
                          ? `${slot.startTime} — ${slot.endTime}`
                          : "Custom Slot";

                        return (
                          <tr key={b._id} className="border-b border-border hover:bg-card/45 transition-colors duration-200">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-foreground">{b.customerName}</div>
                              <div className="text-muted-foreground text-[10px] mt-0.5">{b.customerEmail}</div>
                            </td>
                            <td className="py-3.5 px-4 text-foreground font-medium">{pName}</td>
                            <td className="py-3.5 px-4 text-muted-foreground">
                              {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                timeZone: "UTC"
                              }) : "-"}
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground font-medium">{formattedTime}</td>
                            <td className="py-3.5 px-4 text-primary font-semibold">{formatPrice(b.amount)}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-sm ${
                                  b.paymentStatus === "completed"
                                    ? "bg-green-500/10 text-green-500 border border-green-500/10"
                                    : b.paymentStatus === "failed"
                                      ? "bg-destructive/10 text-destructive border border-destructive/10"
                                      : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/10"
                                }`}
                                style={{ letterSpacing: "0.05em" }}
                              >
                                {b.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedDetailedBooking(b)}
                                className="px-3 py-1.5 border border-primary/20 hover:border-primary text-primary hover:bg-primary/5
                                           transition-all uppercase text-[10px] tracking-wider rounded-sm font-medium"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border mt-4 text-xs">
                  <div className="text-muted-foreground">
                    Showing page <span className="text-foreground font-medium">{currentPage}</span> of{" "}
                    <span className="text-foreground font-medium">{totalPages}</span> (Total {totalBookingsCount} bookings)
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-border hover:border-primary/50 text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageIdx = idx + 1;
                      // Display a max of 5 page buttons around current page
                      if (Math.abs(pageIdx - currentPage) > 2 && pageIdx !== 1 && pageIdx !== totalPages) {
                        if (pageIdx === 2 || pageIdx === totalPages - 1) {
                          return <span key={`dots-${pageIdx}`} className="px-1 text-muted-foreground">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={`page-${pageIdx}`}
                          onClick={() => setCurrentPage(pageIdx)}
                          className={`w-8 h-8 flex items-center justify-center border transition-all ${
                            currentPage === pageIdx
                              ? "bg-primary border-primary text-primary-foreground font-bold"
                              : "border-border hover:border-primary/50 text-foreground"
                          }`}
                        >
                          {pageIdx}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-border hover:border-primary/50 text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      aria-label="Next Page"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 border border-border border-dashed text-muted-foreground text-sm">
                {searchTerm ? "No bookings match your search query." : "No bookings logged in the database yet."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Block Reason Modal */}
      <AnimatePresence>
        {blockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setBlockModal(null)}
              className="absolute inset-0 bg-black"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-md border border-border bg-card/95 backdrop-blur-xl p-7 shadow-2xl relative z-10"
            >
              <button
                onClick={() => setBlockModal(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <div className="mb-5">
                <div className="flex items-center gap-3 mb-1">
                  <Ban size={16} className="text-destructive" />
                  <h3 className="text-foreground font-semibold text-sm">
                    {blockModal.type === "date"
                      ? `Block ${selectedDate}`
                      : `Block ${blockModal.slot?.startTime} — ${blockModal.slot?.endTime}`}
                  </h3>
                </div>
                <p className="text-muted-foreground text-xs ml-7">
                  Optionally add a reason visible to visitors. Leave blank to skip.
                </p>
              </div>

              <div className="mb-6">
                <label className="section-label block mb-2" style={{ fontSize: "0.6rem" }}>
                  Reason <span className="text-muted-foreground/60 font-normal normal-case">(Optional — shown to visitors)</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Studio Closed, On Leave, Camera Maintenance..."
                  className="w-full bg-input border border-border text-foreground px-4 py-3
                             focus:outline-none focus:border-primary transition-colors
                             placeholder-muted-foreground text-sm"
                  value={blockModalReason}
                  onChange={(e) => setBlockModalReason(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (blockModal.type === "date") confirmBlockDate(blockModalReason);
                      else if (blockModal.slot) confirmBlockSlot(blockModal.slot, blockModalReason);
                    }
                    if (e.key === "Escape") setBlockModal(null);
                  }}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setBlockModal(null)}
                  className="px-4 py-2 border border-border text-muted-foreground hover:text-foreground text-xs uppercase transition-colors"
                  style={{ letterSpacing: "0.1em" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (blockModal.type === "date") confirmBlockDate(blockModalReason);
                    else if (blockModal.slot) confirmBlockSlot(blockModal.slot, blockModalReason);
                  }}
                  className="px-4 py-2 bg-destructive text-white hover:bg-destructive/90 text-xs uppercase font-semibold transition-colors flex items-center gap-2"
                  style={{ letterSpacing: "0.1em" }}
                >
                  <Ban size={12} />
                  {blockModal.type === "date" ? "Block Day" : "Block Slot"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Details Modal Popup */}
      <AnimatePresence>
        {selectedDetailedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDetailedBooking(null)}
              className="absolute inset-0 bg-black"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl border border-border bg-card/95 backdrop-blur-xl p-6 md:p-8 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedDetailedBooking(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Close details"
              >
                <X size={18} />
              </button>

              {/* Title Header */}
              <div className="mb-6 pb-4 border-b border-border flex items-start gap-4">
                <div className="w-12 h-12 border border-primary/20 bg-primary/5 flex items-center justify-center text-primary">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <span className="section-label" style={{ fontSize: "0.55rem" }}>Order Details</span>
                  <h3 className="text-lg font-bold text-foreground font-serif tracking-wide mt-1">
                    Booking for {selectedDetailedBooking.customerName}
                  </h3>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                {/* Customer Details */}
                <div className="space-y-4">
                  <h4 className="section-label uppercase tracking-widest text-[9px] border-b border-border pb-1 text-primary">
                    Customer Profile
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2">
                      <User size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Full Name</p>
                        <p className="text-foreground text-sm font-semibold mt-0.5">{selectedDetailedBooking.customerName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Mail size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Email Address</p>
                        <p className="text-foreground text-sm font-medium mt-0.5">{selectedDetailedBooking.customerEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Phone Number</p>
                        <p className="text-foreground text-sm font-medium mt-0.5">{selectedDetailedBooking.customerPhone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <FileText size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Customer Notes</p>
                        <p className="text-foreground italic mt-1 bg-input p-2 rounded-sm border border-border/50 text-[11px] leading-relaxed">
                          {selectedDetailedBooking.notes || "No special requests submitted."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session & Payment Details */}
                <div className="space-y-4">
                  <h4 className="section-label uppercase tracking-widest text-[9px] border-b border-border pb-1 text-primary">
                    Session & Payment Logs
                  </h4>
                  
                  <div className="space-y-3.5 bg-input/40 p-4 border border-border/80 rounded-sm">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Program Booked</p>
                      <p className="text-foreground font-semibold mt-0.5 text-sm">
                        {typeof selectedDetailedBooking.program === "object" && "name" in selectedDetailedBooking.program
                          ? selectedDetailedBooking.program.name
                          : "Standard Program"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Session Date</p>
                        <p className="text-foreground font-medium mt-0.5">
                          {selectedDetailedBooking.bookingDate ? new Date(selectedDetailedBooking.bookingDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            timeZone: "UTC"
                          }) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Session Time</p>
                        <p className="text-foreground font-medium mt-0.5">
                          {typeof selectedDetailedBooking.timeSlot === "object" && selectedDetailedBooking.timeSlot && "startTime" in selectedDetailedBooking.timeSlot
                            ? `${selectedDetailedBooking.timeSlot.startTime} — ${selectedDetailedBooking.timeSlot.endTime}`
                            : "Standard Time"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-border/70 pt-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Amount Paid</p>
                        <p className="text-primary font-bold mt-0.5 text-sm">
                          {formatPrice(selectedDetailedBooking.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Payment Status</p>
                        <p className="text-foreground font-semibold uppercase mt-0.5 tracking-wider text-[10px] text-green-500">
                          {selectedDetailedBooking.paymentStatus}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border/70 pt-3 space-y-1.5">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Razorpay Order ID: </span>
                        <span className="text-foreground font-mono text-[10px] ml-1 bg-background px-1.5 py-0.5 border border-border">{selectedDetailedBooking.razorpayOrderId}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Razorpay Payment ID: </span>
                        <span className="text-foreground font-mono text-[10px] ml-1 bg-background px-1.5 py-0.5 border border-border">{selectedDetailedBooking.razorpayPaymentId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-border flex justify-end">
                <button
                  onClick={() => setSelectedDetailedBooking(null)}
                  className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold uppercase text-xs tracking-wider"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
