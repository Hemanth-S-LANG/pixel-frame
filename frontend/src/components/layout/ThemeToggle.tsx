"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="w-9 h-9 border border-border flex items-center justify-center rounded-full"
        aria-label="Toggle theme"
      >
        <div className="w-4 h-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-9 h-9 border border-border-strong flex items-center justify-center rounded-full
                 hover:border-primary hover:text-primary transition-all duration-300 group overflow-hidden"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-500"
        style={{
          transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)",
          opacity: isDark ? 1 : 0,
        }}
      >
        <Moon size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-500"
        style={{
          transform: isDark ? "rotate(-90deg) scale(0)" : "rotate(0deg) scale(1)",
          opacity: isDark ? 0 : 1,
        }}
      >
        <Sun size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </span>
    </button>
  );
}
