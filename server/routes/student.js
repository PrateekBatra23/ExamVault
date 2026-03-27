const express = require("express");
const router  = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { exams, submissions, getNextSubmissionId, saveSubmissions } = require("../data/store");
const { logger } = require("../logger");

router.use(verifyToken);
router.use(requireRole("student"));

// GET /api/student/exams
router.get("/exams", (req, res) => {
  logger.info("STUDENT", "Fetching available exams list", { user: req.user.username });
  const list = exams.map((e) => ({
    id: e.id, title: e.title, subject: e.subject,
    createdByName: e.createdByName, duration: e.duration,
    questionCount: e.questions.length, createdAt: e.createdAt,
    submitted: submissions.some((s) => s.examId === e.id && s.studentId === req.user.id),
  }));
  res.json({ success: true, exams: list });
});

// GET /api/student/exams/:id
router.get("/exams/:id", (req, res) => {
  const exam = exams.find((e) => e.id === parseInt(req.params.id));
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found." });

  const already = submissions.find((s) => s.examId === exam.id && s.studentId === req.user.id);
  if (already) {
    logger.warn("STUDENT", "Attempt to re-access already submitted exam", { user: req.user.username, exam: exam.title });
    return res.status(400).json({ success: false, message: "You have already submitted this exam.", yourScore: already.score, total: already.total });
  }

  logger.info("STUDENT", "Exam questions fetched (correct answers stripped)", { user: req.user.username, exam: exam.title });
  const safeQuestions = exam.questions.map(({ correct, ...q }) => q);
  res.json({ success: true, exam: { id: exam.id, title: exam.title, subject: exam.subject, duration: exam.duration, questions: safeQuestions } });
});

// POST /api/student/exams/:id/submit
router.post("/exams/:id/submit", (req, res) => {
  const exam = exams.find((e) => e.id === parseInt(req.params.id));
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found." });

  const already = submissions.find((s) => s.examId === exam.id && s.studentId === req.user.id);
  if (already) return res.status(400).json({ success: false, message: "Already submitted." });

  const { answers } = req.body;
  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ success: false, message: "Answers object required." });
  }

  let score = 0;
  const gradedAnswers = {};
  exam.questions.forEach((q) => {
    const studentAnswer = answers[q.id];
    const isCorrect = studentAnswer === q.correct;
    if (isCorrect) score++;
    gradedAnswers[q.id] = { submitted: studentAnswer, correct: q.correct, isCorrect };
  });

  const submission = {
    id: getNextSubmissionId(),
    examId: exam.id, studentId: req.user.id, studentName: req.user.name,
    answers, score, total: exam.questions.length, submittedAt: new Date(),
  };
  submissions.push(submission);
  saveSubmissions(submissions);

  const grade = score === exam.questions.length ? "A+" : score >= exam.questions.length * 0.8 ? "A" : score >= exam.questions.length * 0.6 ? "B" : "C";
  res.status(201).json({
    success: true, message: "Exam submitted successfully!",
    result: { examTitle: exam.title, score, total: exam.questions.length, percentage: ((score / exam.questions.length) * 100).toFixed(1), grade, gradedAnswers, submittedAt: submission.submittedAt },
  });
});

// GET /api/student/results
router.get("/results", (req, res) => {
  logger.info("STUDENT", "Fetching personal results", { user: req.user.username });
  const myResults = submissions.filter((s) => s.studentId === req.user.id).map((s) => {
    const exam = exams.find((e) => e.id === s.examId);
    return { examTitle: exam?.title, subject: exam?.subject, score: s.score, total: s.total, percentage: ((s.score / s.total) * 100).toFixed(1), submittedAt: s.submittedAt };
  });
  res.json({ success: true, student: req.user.name, results: myResults });
});

module.exports = router;
