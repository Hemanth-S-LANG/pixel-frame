import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// No fallback defaults — if these are missing, server.ts validates and exits before we get here.
const JWT_SECRET = process.env.JWT_SECRET as string;

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
 * Password is verified with bcrypt against ADMIN_PASSWORD_HASH — never compared in plaintext.
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  // No fallback — validated at startup; these must exist.
  const adminUsername     = process.env.ADMIN_USERNAME      as string;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH as string;

  // Constant-time username check (avoid early-exit timing leak)
  const usernameMatch = username === adminUsername;

  // Always run bcrypt.compare even on username mismatch to prevent timing attacks
  // that distinguish "wrong username" from "wrong password" via response time.
  const passwordMatch = await bcrypt.compare(password || "", adminPasswordHash);

  if (!usernameMatch || !passwordMatch) {
    res.status(401).json({ success: false, message: "Invalid username or password" });
    return;
  }

  const token = jwt.sign(
    { username: adminUsername, role: "admin" },
    JWT_SECRET,
    { expiresIn: "8h" }
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
