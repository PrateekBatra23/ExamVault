const express = require("express");
const router  = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { exams, submissions, getNextExamId, saveExams, saveSubmissions } = require("../data/store");
const { logger } = require("../logger");

router.use(verifyToken);
router.use(requireRole("faculty"));

// GET /api/faculty/exams
router.get("/exams", (req, res) => {
  const ownExams = exams.filter((e) => e.createdBy === req.user.id);
  logger.info("FACULTY", "Fetching faculty exams", { user: req.user.username, count: ownExams.length });
  res.json({
    success: true, totalExams: ownExams.length,
    exams: ownExams.map((e) => ({
      id: e.id, title: e.title, subject: e.subject,
      createdByName: e.createdByName, duration: e.duration,
      questionCount: e.questions.length,
      submissionCount: submissions.filter((s) => s.examId === e.id).length,
      createdAt: e.createdAt,
    })),
  });
});

// POST /api/faculty/exams
router.post("/exams", (req, res) => {
  const { title, subject, duration, questions } = req.body;
  if (!title || !subject || !duration || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, message: "Required: title, subject, duration, questions (array, non-empty)." });
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.text || !Array.isArray(q.options) || q.options.length < 2 || q.correct === undefined || q.correct < 0 || q.correct >= q.options.length) {
      return res.status(400).json({ success: false, message: `Question ${i + 1} invalid. Needs: text, options (min 2), correct (valid index).` });
    }
  }
  const newExam = {
    id: getNextExamId(), title, subject, createdBy: req.user.id,
    createdByName: req.user.name, duration, createdAt: new Date(),
    questions: questions.map((q, idx) => ({ id: idx + 1, text: q.text, options: q.options, correct: q.correct })),
  };
  exams.push(newExam);
  saveExams(exams);
  logger.examCreated(req.user.name, title, questions.length);
  res.status(201).json({ success: true, message: `Exam "${title}" created.`, exam: newExam });
});

// GET /api/faculty/submissions
router.get("/submissions", (req, res) => {
  const ownExamIds = new Set(exams.filter((e) => e.createdBy === req.user.id).map((e) => e.id));
  const ownSubmissions = submissions.filter((s) => ownExamIds.has(s.examId));
  logger.info("FACULTY", "Fetching faculty submissions", { user: req.user.username, total: ownSubmissions.length });
  const enriched = ownSubmissions.map((s) => {
    const exam = exams.find((e) => e.id === s.examId);
    const pct  = ((s.score / s.total) * 100).toFixed(1);
    return {
      submissionId: s.id, student: s.studentName, studentId: s.studentId,
      exam: exam?.title, subject: exam?.subject,
      score: s.score, total: s.total, percentage: pct,
      grade: s.score === s.total ? "A+" : s.score >= s.total * 0.8 ? "A" : s.score >= s.total * 0.6 ? "B" : "C",
      submittedAt: s.submittedAt,
    };
  });
  res.json({ success: true, totalSubmissions: enriched.length, submissions: enriched });
});

// GET /api/faculty/submissions/:examId
router.get("/submissions/:examId", (req, res) => {
  const examId = parseInt(req.params.examId);
  const exam   = exams.find((e) => e.id === examId);
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found." });
  if (exam.createdBy !== req.user.id) return res.status(403).json({ success: false, message: "You may access only your own exam submissions." });

  logger.info("FACULTY", "Fetching exam-specific submissions", { user: req.user.username, exam: exam.title });
  const examSubs = submissions.filter((s) => s.examId === examId).map((s) => ({
    submissionId: s.id, student: s.studentName, studentId: s.studentId,
    score: s.score, total: s.total,
    percentage: ((s.score / s.total) * 100).toFixed(1),
    submittedAt: s.submittedAt,
  }));
  const avgScore = examSubs.length ? (examSubs.reduce((sum, s) => sum + s.score, 0) / examSubs.length).toFixed(2) : 0;
  res.json({
    success: true, exam: { id: exam.id, title: exam.title, subject: exam.subject },
    stats: { totalSubmissions: examSubs.length, averageScore: avgScore },
    submissions: examSubs,
  });
});

// GET /api/faculty/results
router.get("/results", (req, res) => {
  const ownExams = exams.filter((e) => e.createdBy === req.user.id);
  logger.info("FACULTY", "Generating results report", { user: req.user.username, totalExams: ownExams.length });
  const results = ownExams.map((exam) => {
    const examSubs = submissions.filter((s) => s.examId === exam.id);
    const avg = examSubs.length ? examSubs.reduce((sum, s) => sum + s.score, 0) / examSubs.length : 0;
    return {
      examId: exam.id, examTitle: exam.title, subject: exam.subject,
      totalStudents: examSubs.length,
      averageScore: avg.toFixed(2),
      averagePercentage: ((avg / exam.questions.length) * 100).toFixed(1),
      highestScore: examSubs.length ? Math.max(...examSubs.map((s) => s.score)) : 0,
      lowestScore:  examSubs.length ? Math.min(...examSubs.map((s) => s.score)) : 0,
    };
  });
  res.json({ success: true, managedBy: req.user.name, results });
});

// DELETE /api/faculty/exams/:id
router.delete("/exams/:id", (req, res) => {
  const examId = parseInt(req.params.id);
  const idx    = exams.findIndex((e) => e.id === examId);
  if (idx === -1) return res.status(404).json({ success: false, message: "Exam not found." });
  const deleted = exams[idx];
  if (deleted.createdBy !== req.user.id) return res.status(403).json({ success: false, message: "You may delete only your own exams." });

  exams.splice(idx, 1);
  const removed = submissions.filter((s) => s.examId === examId).length;
  submissions.splice(0, submissions.length, ...submissions.filter((s) => s.examId !== examId));
  saveExams(exams);
  saveSubmissions(submissions);
  logger.warn("FACULTY", "Exam deleted", { faculty: req.user.username, exam: deleted.title, removedSubmissions: removed });
  res.json({ success: true, message: `Exam "${deleted.title}" deleted along with ${removed} submission(s).` });
});

module.exports = router;
