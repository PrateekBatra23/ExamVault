const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { logger } = require("../logger");

const verifyToken = (req, res, next) => {
  const endpoint   = `${req.method} ${req.originalUrl}`;
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    logger.tokenInvalid("No Authorization header", endpoint);
    return res.status(401).json({
      success: false, error: "ACCESS DENIED",
      message: "No token provided. Authorization header is missing.",
      code: "TOKEN_MISSING",
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    logger.tokenInvalid("Malformed Authorization header", endpoint);
    return res.status(401).json({
      success: false, error: "ACCESS DENIED",
      message: "Invalid token format. Use: Bearer <token>",
      code: "TOKEN_MALFORMED",
    });
  }

  const token = parts[1];
  logger.tokenReceived(endpoint, token.slice(0, 20));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    logger.tokenValid(decoded, endpoint);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      logger.tokenInvalid("Token expired", endpoint, { expiredAt: err.expiredAt });
      return res.status(401).json({
        success: false, error: "TOKEN EXPIRED",
        message: "Your session has expired. Please log in again.",
        code: "TOKEN_EXPIRED",
      });
    }
    logger.tokenInvalid("Invalid signature / corrupted token", endpoint);
    return res.status(401).json({
      success: false, error: "INVALID TOKEN",
      message: "Token is invalid or corrupted.",
      code: "TOKEN_INVALID",
    });
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  const endpoint = `${req.method} ${req.originalUrl}`;
  logger.roleCheck(req.user.role, allowedRoles, endpoint);

  if (!allowedRoles.includes(req.user.role)) {
    logger.accessDenied(req.user.username, req.user.role, allowedRoles.join("|"), endpoint);
    return res.status(403).json({
      success: false, error: "FORBIDDEN",
      message: `Access denied. Requires role: [${allowedRoles.join(", ")}]. Your role: ${req.user.role}`,
      code: "INSUFFICIENT_ROLE",
    });
  }

  logger.accessGranted(req.user.username, req.user.role, endpoint);
  next();
};

module.exports = { verifyToken, requireRole };
