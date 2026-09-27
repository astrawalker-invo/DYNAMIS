import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  const token =
    header?.startsWith("Bearer ") ? header.slice(7) : req.query?.token;
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      home_id: payload.home_id ?? null,
      demo_home_id: payload.demo_home_id ?? null,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

/** Block demo role from routes that would mutate real data or publish MQTT commands. */
export function blockDemo(req, res, next) {
  if (req.user?.role === "demo") {
    return res.status(403).json({
      error: "Demo mode: this action is disabled (no real devices or commands).",
    });
  }
  next();
}

export function signToken(payload, expiresIn) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export { JWT_SECRET };
