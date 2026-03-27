const fs = require("fs");
const path = require("path");

// ─── DATA DIRECTORY ────────────────────────────────────────────────
const dataDir = path.join(__dirname, "storage");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const examsFile = path.join(dataDir, "exams.json");
const submissionsFile = path.join(dataDir, "submissions.json");

// ─── SAVE FUNCTIONS ───────────────────────────────────────────────
const saveExams = (exams) => {
  try {
    fs.writeFileSync(examsFile, JSON.stringify(exams, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving exams to file:", err.message);
  }
};

const saveSubmissions = (submissions) => {
  try {
    fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving submissions to file:", err.message);
  }
};

// ─── LOAD FUNCTIONS ───────────────────────────────────────────────
const loadExams = () => {
  try {
    if (fs.existsSync(examsFile)) {
      const data = fs.readFileSync(examsFile, "utf8");
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      return parsed.map((exam) => ({
        ...exam,
        createdAt: new Date(exam.createdAt),
      }));
    }
  } catch (err) {
    console.error("Error loading exams from file:", err.message);
  }
  return [];
};

const loadSubmissions = () => {
  try {
    if (fs.existsSync(submissionsFile)) {
      const data = fs.readFileSync(submissionsFile, "utf8");
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      return parsed.map((submission) => ({
        ...submission,
        submittedAt: new Date(submission.submittedAt),
      }));
    }
  } catch (err) {
    console.error("Error loading submissions from file:", err.message);
  }
  return [];
};

module.exports = {
  saveExams,
  saveSubmissions,
  loadExams,
  loadSubmissions,
};
