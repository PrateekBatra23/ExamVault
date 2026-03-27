const fs   = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const logFile = path.join(logsDir, "app.log");

const C = {
  reset:"\x1b[0m", dim:"\x1b[2m", bold:"\x1b[1m",
  green:"\x1b[32m", yellow:"\x1b[33m", red:"\x1b[31m",
  cyan:"\x1b[36m", blue:"\x1b[34m", white:"\x1b[37m", gray:"\x1b[90m",
};

const LEVEL_COLOR = { INFO:C.green, WARN:C.yellow, ERROR:C.red, DEBUG:C.cyan };

function log(level, category, message, meta = {}) {
  const timestamp = new Date().toISOString().replace("T"," ").slice(0,23);
  const metaStr   = Object.entries(meta).map(([k,v]) => `${k}=${v}`).join(" | ");
  const fileLine  = `[${timestamp}] [${level.padEnd(5)}] [${category.padEnd(8)}] ${message}${metaStr ? "  ::  " + metaStr : ""}\n`;
  const lc        = LEVEL_COLOR[level] || C.white;
  const consoleLine =
    `${C.gray}[${timestamp}]${C.reset} ` +
    `${lc}${C.bold}[${level.padEnd(5)}]${C.reset} ` +
    `${C.cyan}[${category.padEnd(8)}]${C.reset} ` +
    `${C.white}${message}${C.reset}` +
    (metaStr ? `  ${C.gray}${metaStr}${C.reset}` : "");
  console.log(consoleLine);
  fs.appendFileSync(logFile, fileLine);
}

function divider(label = "") {
  const text = label ? `\n─── ${label} ${"─".repeat(Math.max(0,64-label.length))}\n` : `\n${"─".repeat(70)}\n`;
  console.log(`${C.gray}${text}${C.reset}`);
  fs.appendFileSync(logFile, text);
}

const logger = {
  info:  (cat,msg,meta) => log("INFO",  cat, msg, meta),
  warn:  (cat,msg,meta) => log("WARN",  cat, msg, meta),
  error: (cat,msg,meta) => log("ERROR", cat, msg, meta),
  debug: (cat,msg,meta) => log("DEBUG", cat, msg, meta),
  divider,

  request(method, url, ip) {
    log("INFO","REQUEST",`${method} ${url}`, { ip });
  },

  loginAttempt(username, ip) {
    divider("STEP 1 - LOGIN REQUEST");
    log("INFO","AUTH","Login attempt received", { username, ip });
  },

  tokenIssued(user, token) {
    const parts   = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1],"base64").toString());
    divider("STEP 2 - JWT GENERATION");
    log("INFO","AUTH","Credentials verified - generating JWT", { username: user.username, role: user.role.toUpperCase() });
    log("INFO","JWT", "Token signed (HS256)", { algorithm:"HS256", type:"JWT" });
    log("INFO","JWT", "Payload embedded in token", {
      sub: payload.id, username: payload.username, role: payload.role,
      iat: new Date(payload.iat*1000).toISOString(),
      exp: new Date(payload.exp*1000).toISOString(),
    });
    log("INFO","JWT", `Structure: ${parts[0].slice(0,12)}…[header] . ${parts[1].slice(0,16)}…[payload] . ${parts[2].slice(0,16)}…[sig]`);
    log("INFO","AUTH","JWT issued to client", { user: user.name, role: user.role });
  },

  tokenReceived(endpoint, tokenSnippet) {
    divider("STEP 3 & 4 - TOKEN USAGE & VERIFICATION");
    log("INFO","MIDWARE","Bearer token received from client", { endpoint, token: tokenSnippet+"…" });
  },

  tokenValid(decoded, endpoint) {
    log("INFO","MIDWARE","Token signature valid - payload decoded", {
      user: decoded.username, role: decoded.role,
      exp: new Date(decoded.exp*1000).toISOString(),
    });
    log("INFO","MIDWARE","Token not expired - proceeding", { endpoint });
  },

  tokenInvalid(reason, endpoint, extra = {}) {
    divider("STEP 4 - TOKEN VERIFICATION FAILED");
    log("WARN","MIDWARE",`Token rejected - ${reason}`, { endpoint, ...extra });
  },

  roleCheck(userRole, requiredRoles, endpoint) {
    divider("STEP 5 & 6 - ROLE CHECK & ACCESS CONTROL");
    log("INFO","RBAC","Role-based access check initiated", {
      user_role: userRole, required: requiredRoles.join("|"), endpoint,
    });
  },

  accessGranted(username, role, endpoint) {
    log("INFO","RBAC","Role authorized - ACCESS GRANTED [ok]", { user: username, role, endpoint });
  },

  accessDenied(username, userRole, requiredRole, endpoint) {
    log("WARN","RBAC","Role mismatch - ACCESS DENIED [X]", {
      user: username, user_role: userRole, required_role: requiredRole, endpoint,
    });
  },

  loginFailed(username, reason, ip) {
    log("WARN","AUTH",`Login failed - ${reason}`, { username, ip });
  },

  examSubmitted(studentName, examTitle, score, total) {
    divider("EXAM SUBMISSION");
    log("INFO","EXAM","Exam submitted and auto-graded", {
      student: studentName, exam: examTitle,
      score: `${score}/${total}`, pct: ((score/total)*100).toFixed(1)+"%",
    });
  },

  examCreated(facultyName, title, questionCount) {
    log("INFO","EXAM","New exam created by faculty", { faculty: facultyName, title, questions: questionCount });
  },
};

function printBanner(port) {
  const line = "═".repeat(58);
  console.log([
    `\n${C.blue}${C.bold}${line}${C.reset}`,
    `${C.blue}${C.bold}  VITONLINE - Secure Examination System${C.reset}`,
    `${C.gray}  JWT Authentication + Role-Based Access Control${C.reset}`,
    `${C.blue}${C.bold}${line}${C.reset}`,
    `${C.gray}  URL     : ${C.white}http://localhost:${port}${C.reset}`,
    `${C.gray}  Logs    : ${C.white}logs/app.log${C.reset}`,
    `${C.gray}  Auth    : ${C.white}HS256 JWT  |  Expiry: 1h${C.reset}`,
    `${C.blue}${C.bold}${line}${C.reset}`,
    `${C.gray}  Faculty : faculty1 / faculty123${C.reset}`,
    `${C.gray}  Student : student1 / student123${C.reset}`,
    `${C.blue}${C.bold}${line}${C.reset}\n`,
  ].join("\n"));
  fs.appendFileSync(logFile,
    `\n${"=".repeat(58)}\nVITONLINE started at ${new Date().toISOString()}\n${"=".repeat(58)}\n\n`
  );
}

module.exports = { logger, printBanner };
