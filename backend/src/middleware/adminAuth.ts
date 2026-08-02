import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

// Extend Request to include admin info
export interface AdminRequest extends Request {
  admin?: { username: string };
}

/**
 * Middleware that protects admin routes.
 * Expects header: Authorization: Bearer <token>
 */
export const requireAdmin = (req: AdminRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Unauthorized — admin login required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };

    if (decoded.role !== "admin") {
      res.status(403).json({ success: false, message: "Forbidden — admin access only" });
      return;
    }

    req.admin = { username: decoded.username };
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token — please login again" });
  }
};

/**
 * POST /api/admin/login
 * Validates admin credentials and returns a JWT token.
 */
export const adminLogin = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "cole2026";

  if (username !== adminUsername || password !== adminPassword) {
    res.status(401).json({ success: false, message: "Invalid username or password" });
    return;
  }

  const token = jwt.sign(
    { username: adminUsername, role: "admin" },
    JWT_SECRET,
    { expiresIn: "8h" } // Token valid for 8 hours
  );

  res.json({
    success: true,
    data: {
      token,
      expiresIn: "8h",
      username: adminUsername,
    },
  });
};
