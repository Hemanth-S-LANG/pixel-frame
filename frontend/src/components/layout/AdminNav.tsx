"use client";

import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";
import { LogOut, Calendar, Users } from "lucide-react";

interface AdminNavProps {
  activeTab: "calendar" | "bookings";
  setActiveTab: (tab: "calendar" | "bookings") => void;
  onLogout: () => void;
}

export function AdminNav({ activeTab, setActiveTab, onLogout }: AdminNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-glass border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-foreground uppercase text-sm hover:text-primary transition-colors duration-300 font-medium"
          style={{ fontFamily: "var(--font-serif)", letterSpacing: "0.25em" }}
        >
          Marcus <span className="text-primary font-bold">Cole</span> <span className="text-xs text-muted-foreground ml-2 px-1.5 py-0.5 border border-border">Admin</span>
        </Link>

        {/* Tab Controls / Navigation inside Admin */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase transition-all duration-300 border-b-2 ${
              activeTab === "calendar"
                ? "text-primary border-primary font-semibold"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
            }`}
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}
          >
            <Calendar size={14} />
            Update Availability
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase transition-all duration-300 border-b-2 ${
              activeTab === "bookings"
                ? "text-primary border-primary font-semibold"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
            }`}
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}
          >
            <Users size={14} />
            View Bookings
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground
                       transition-all duration-300 uppercase text-xs rounded-sm font-medium"
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.1em" }}
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Tab Control */}
      <div className="md:hidden flex border-t border-border bg-background/50">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase border-r border-border transition-colors ${
            activeTab === "calendar" ? "text-primary bg-card/40 font-semibold" : "text-muted-foreground"
          }`}
          style={{ letterSpacing: "0.1em" }}
        >
          <Calendar size={14} />
          Availability
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase transition-colors ${
            activeTab === "bookings" ? "text-primary bg-card/40 font-semibold" : "text-muted-foreground"
          }`}
          style={{ letterSpacing: "0.1em" }}
        >
          <Users size={14} />
          Bookings
        </button>
      </div>
    </nav>
  );
}
