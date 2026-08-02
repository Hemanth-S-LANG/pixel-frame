"use client";

import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";
import { LogOut, Calendar, Users, MessageSquare } from "lucide-react";

interface AdminNavProps {
  activeTab: "calendar" | "bookings" | "messages";
  setActiveTab: (tab: "calendar" | "bookings" | "messages") => void;
  onLogout: () => void;
  unreadMessages?: number;
}

export function AdminNav({ activeTab, setActiveTab, onLogout, unreadMessages = 0 }: AdminNavProps) {
  const tabClass = (tab: string) =>
    `flex items-center gap-2 px-4 py-2 text-xs uppercase transition-all duration-300 border-b-2 ${
      activeTab === tab
        ? "text-primary border-primary font-semibold"
        : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-glass border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-foreground uppercase text-sm hover:text-primary transition-colors duration-300 font-medium"
          style={{ fontFamily: "var(--font-serif)", letterSpacing: "0.25em" }}
        >
          Sapthagiri <span className="text-primary font-bold">Studio</span>{" "}
          <span className="text-xs text-muted-foreground ml-2 px-1.5 py-0.5 border border-border">Admin</span>
        </Link>

        {/* Tabs */}
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => setActiveTab("calendar")} className={tabClass("calendar")}
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}>
            <Calendar size={14} /> Update Availability
          </button>
          <button onClick={() => setActiveTab("bookings")} className={tabClass("bookings")}
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}>
            <Users size={14} /> View Bookings
          </button>
          <button onClick={() => setActiveTab("messages")} className={`${tabClass("messages")} relative`}
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}>
            <MessageSquare size={14} /> Messages
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-destructive text-white text-[9px] flex items-center justify-center font-bold">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground
                       transition-all duration-300 uppercase text-xs rounded-sm font-medium"
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.1em" }}>
            <LogOut size={12} /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden flex border-t border-border bg-background/50">
        <button onClick={() => setActiveTab("calendar")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase border-r border-border transition-colors ${
            activeTab === "calendar" ? "text-primary bg-card/40 font-semibold" : "text-muted-foreground"
          }`} style={{ letterSpacing: "0.1em" }}>
          <Calendar size={14} /> Availability
        </button>
        <button onClick={() => setActiveTab("bookings")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase border-r border-border transition-colors ${
            activeTab === "bookings" ? "text-primary bg-card/40 font-semibold" : "text-muted-foreground"
          }`} style={{ letterSpacing: "0.1em" }}>
          <Users size={14} /> Bookings
        </button>
        <button onClick={() => setActiveTab("messages")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase relative transition-colors ${
            activeTab === "messages" ? "text-primary bg-card/40 font-semibold" : "text-muted-foreground"
          }`} style={{ letterSpacing: "0.1em" }}>
          <MessageSquare size={14} /> Messages
          {unreadMessages > 0 && (
            <span className="absolute top-1 right-4 w-4 h-4 rounded-full bg-destructive text-white text-[9px] flex items-center justify-center font-bold">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
