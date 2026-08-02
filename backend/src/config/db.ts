import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
      // Connection pool: allows up to 50 simultaneous MongoDB operations.
      // Each incoming HTTP request that touches the DB uses one pool connection.
      // With 50 connections, 50+ concurrent users can query the DB without waiting.
      maxPoolSize: 50,
      // Minimum idle connections kept warm — avoids cold-start latency for bursts.
      minPoolSize: 5,
      // If all 50 pool connections are busy, new requests wait up to 10s
      // before getting a "connection pool exhausted" error.
      waitQueueTimeoutMS: 10000,
      // Heartbeat every 10s to detect dead connections quickly.
      heartbeatFrequencyMS: 10000,
      // Auto-create indexes defined in schemas (important for the compound index
      // on TimeSlot that prevents duplicate slots).
      autoIndex: true,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host} (pool: 50)`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected. Attempting reconnection...");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err);
  });
};

export default connectDB;
