const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");
const { users }           = require("../data/store");
const { JWT_SECRET, JWT_EXPIRY } = require("../config");
const { logger }          = require("../logger");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  logger.loginAttempt(username || "(none)", ip);

  if (!username || !password) {
    logger.loginFailed(username || "(none)", "Missing username or password", ip);
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }

  const user = users.find((u) => u.username === username);
  if (!user) {
    logger.loginFailed(username, "User not found in system", ip);
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    logger.loginFailed(username, "Incorrect password", ip);
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const payload = { id: user.id, username: user.username, name: user.name, role: user.role };
  const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  const decoded = jwt.decode(token);

  logger.tokenIssued(user, token);

  return res.status(200).json({
    success: true,
    message: `Welcome, ${user.name}!`,
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
    tokenInfo: {
      issuedAt:  new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      expiresIn: JWT_EXPIRY,
    },
  });
});

// POST /api/auth/verify
router.post("/verify", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: "Token required." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, valid: true, payload: decoded });
  } catch (err) {
    return res.status(401).json({ success: false, valid: false, error: err.message });
  }
});

module.exports = router;
