import "dotenv/config";
import cluster from "node:cluster";
import os from "node:os";
import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import programRoutes from "./routes/programRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import Program from "./models/Program.js";
import TimeSlot from "./models/TimeSlot.js";

const PORT = process.env.PORT || 5000;
const NUM_WORKERS = Math.min(os.cpus().length, 4); // Cap at 4 workers for dev sanity
const USE_CLUSTER = process.env.NODE_ENV === "production"; // Only cluster in production

// ---- Worker Process: Runs the Express server ----
function startServer() {
  const app = express();

  // === Security ===
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin image loads
  }));

  // === Compression — Gzip all responses >1KB ===
  app.use(compression());

  // === CORS ===
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }));

  // === Body Parsing ===
  app.use(express.json({ limit: "1mb" }));

  // === Rate Limiting ===
  // General API limiter: 100 requests per minute per IP
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again in a minute." },
  });

  // Stricter limiter for booking/payment endpoints: 20 per minute per IP
  const bookingLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many booking attempts. Please slow down." },
  });

  // Brute-force protection for admin login: 5 attempts per 15 minutes per IP
  const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many login attempts. Access blocked for 15 minutes." },
  });

  // Apply rate limiters
  app.use("/api", generalLimiter);
  app.use("/api/bookings", bookingLimiter);
  app.use("/api/payments", bookingLimiter);
  app.use("/api/admin/login", adminLoginLimiter);

  // === Routes ===
  app.use("/api/programs", programRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/admin", adminRoutes);

  // Health check — shows worker info
  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "Cole Studio API is running",
      worker: process.pid,
      uptime: Math.floor(process.uptime()) + "s",
    });
  });

  // === Error Handler ===
  app.use(errorHandler);

  // === Start Listening ===
  app.listen(PORT, () => {
    console.log(`🚀 Worker ${process.pid} listening on http://localhost:${PORT}`);
  });
}

// ---- Seed Database ----
async function seedDatabase() {
  const programCount = await Program.countDocuments();
  if (programCount > 0) {
    console.log("📦 Database already seeded — skipping");
    return;
  }

  console.log("🌱 Seeding database with initial data...");

  const programs = await Program.insertMany([
    {
      name: "Film & Cinematography",
      description: "Feature films, short films, music videos, and branded content. From pre-production planning to final delivery, we handle every frame with intention.",
      price: 110000,
      currency: "INR",
      duration: "Full Day — 10 hours",
      category: "cinematography",
      image: "https://images.unsplash.com/photo-1632187981988-40f3cbaeef5e?w=800&h=600&fit=crop&auto=format",
      icon: "Film",
      tags: ["Feature Film", "Music Video", "Documentary"],
    },
    {
      name: "Commercial Photography",
      description: "Product, editorial, corporate, and campaign photography. Still images that hold attention and communicate value at a glance.",
      price: 65000,
      currency: "INR",
      duration: "Half Day — 5 hours",
      category: "photography",
      image: "https://images.unsplash.com/photo-1641236210747-48bc43e4517f?w=800&h=600&fit=crop&auto=format",
      icon: "Camera",
      tags: ["Editorial", "Product", "Campaign"],
    },
    {
      name: "Studio Rental",
      description: "2,400 sq ft of fully equipped production space. Cyclorama wall, professional grid lighting, and a dedicated client lounge.",
      price: 65000,
      currency: "INR",
      duration: "Half Day — 5 hours",
      category: "studio-rental",
      image: "https://images.unsplash.com/photo-1681137063068-081072cf04b4?w=800&h=600&fit=crop&auto=format",
      icon: "Building2",
      tags: ["Cyclorama", "Grid Lighting", "Full Day"],
    },
    {
      name: "Post-Production",
      description: "Color grading, editing, and finishing services. We work in ACES and deliver to broadcast, streaming, and theatrical specifications.",
      price: 75000,
      currency: "INR",
      duration: "Per Project",
      category: "post-production",
      image: "https://images.unsplash.com/photo-1611784728558-6c7d9b409cdf?w=800&h=600&fit=crop&auto=format",
      icon: "Scissors",
      tags: ["Color Grading", "Editing", "DCP"],
    },
  ]);

  // Generate time slots for the next 60 days
  const slotsToInsert = [];
  const now = new Date();
  let programIndex = 0;

  for (let dayOffset = 1; dayOffset <= 60; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);



    // Slot 1: 09:00 - 14:00
    const prog1 = programs[programIndex % programs.length];
    slotsToInsert.push({
      date: new Date(date),
      startTime: "09:00",
      endTime: "14:00",
      program: prog1._id,
      isBooked: false,
      maxBookings: 1,
      currentBookings: 0,
    });
    programIndex++;

    // Slot 2: 14:00 - 19:00
    const prog2 = programs[programIndex % programs.length];
    slotsToInsert.push({
      date: new Date(date),
      startTime: "14:00",
      endTime: "19:00",
      program: prog2._id,
      isBooked: false,
      maxBookings: 1,
      currentBookings: 0,
    });
    programIndex++;

    // Slot 3: 19:00 - 23:00 (except Saturday)
    if (date.getDay() !== 6) {
      const prog3 = programs[programIndex % programs.length];
      slotsToInsert.push({
        date: new Date(date),
        startTime: "19:00",
        endTime: "23:00",
        program: prog3._id,
        isBooked: false,
        maxBookings: 1,
        currentBookings: 0,
      });
      programIndex++;
    }
  }

  await TimeSlot.insertMany(slotsToInsert);
  console.log(`✅ Seeded ${programs.length} programs and ${slotsToInsert.length} time slots`);
}

// ---- Main Entry ----
async function main() {
  // In production, use cluster to fork multiple workers for multi-core scaling.
  // In dev, run a single worker for easy debugging.
  if (USE_CLUSTER && cluster.isPrimary) {
    console.log(`🏗️  Primary process ${process.pid} forking ${NUM_WORKERS} workers...`);

    // Connect to DB once in the primary to seed
    await connectDB();
    await seedDatabase();

    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code) => {
      console.warn(`⚠️  Worker ${worker.process.pid} exited (code ${code}). Restarting...`);
      cluster.fork(); // Auto-restart crashed workers
    });
  } else {
    // Single worker (dev) or forked child (prod)
    await connectDB();

    if (!USE_CLUSTER) {
      await seedDatabase(); // Only seed once
    }

    startServer();
  }
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
