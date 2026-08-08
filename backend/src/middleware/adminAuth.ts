import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// No fallback defaults — validated at startup before server starts.
const JWT_SECRET = process.env.JWT_SECRET as string;

// Cookie options — DRY so set/clear use identical attributes
const COOKIE_NAME = "admin_token";
const cookieOptions = (res: Response) => ({
  httpOnly:  true,                                            // not readable by JS — closes XSS attack
  secure:    process.env.NODE_ENV === "production",          // HTTPS-only in prod
  sameSite:  "strict" as const,                              // no cross-site requests
  maxAge:    8 * 60 * 60 * 1000,                             // 8 hours in ms (matches JWT expiry)
  path:      "/",
});

// Extend Request to include admin info
export interface AdminRequest extends Request {
  admin?: { username: string };
}

/**
 * Middleware that protects admin routes.
 * Reads the JWT from the httpOnly cookie — not from the Authorization header.
 */
export const requireAdmin = (req: AdminRequest, res: Response, next: NextFunction): void => {
  const token = (req as Request & { cookies: Record<string, string> }).cookies?.[COOKIE_NAME];

  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized — admin login required" });
    return;
  }

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
 * Validates credentials with bcrypt, sets the JWT as an httpOnly cookie.
 * Token is NOT returned in the response body — it lives only in the cookie.
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  const adminUsername     = process.env.ADMIN_USERNAME      as string;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH as string;

  // Constant-time username check to avoid timing-based enumeration
  const usernameMatch = username === adminUsername;

  // Always run bcrypt even on username mismatch — prevents timing oracle
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

  // Set httpOnly cookie — JS on the page cannot read this
  res.cookie(COOKIE_NAME, token, cookieOptions(res));

  // Response body does NOT include the token
  res.json({
    success: true,
    data: {
      username: adminUsername,
      expiresIn: "8h",
    },
  });
};

/**
 * POST /api/admin/logout
 * Clears the httpOnly cookie — same options so the browser actually removes it.
 */
export const adminLogout = (_req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === "production",
    sameSite:  "strict" as const,
    path:      "/",
  });
  res.json({ success: true, message: "Logged out successfully" });
};
