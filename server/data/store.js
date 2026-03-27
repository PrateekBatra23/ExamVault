const bcrypt = require("bcryptjs");
const { loadExams, loadSubmissions, saveExams, saveSubmissions } = require("./persistence");

// ─── PRE-SEEDED USERS ──────────────────────────────────────────────
const users = [
  {
    id: 1,
    username: "faculty1",
    password: bcrypt.hashSync("faculty123", 10),
    role: "faculty",
    name: "Dr. Anitha Rajan",
  },
  {
    id: 2,
    username: "Islabudeen M",
    password: bcrypt.hashSync("faculty123", 10),
    role: "faculty",
    name: "Islabudeen M",
  },
  {
    id: 3,
    username: "student1",
    password: bcrypt.hashSync("student123", 10),
    role: "student",
    name: "Arun Kumar",
  },
  {
    id: 4,
    username: "Prateek Batra",
    password: bcrypt.hashSync("student123", 10),
    role: "student",
    name: "Prateek Batra",
  },
  {
    id: 5,
    username: "student3",
    password: bcrypt.hashSync("student123", 10),
    role: "student",
    name: "Ravi Chandran",
  },
];

// ─── PRE-SEEDED EXAMS (DEFAULTS) ──────────────────────────────────
const defaultExams = [
  {
    id: 1,
    title: "Data Structures – Mid Semester",
    subject: "CS301",
    createdBy: 1,
    createdByName: "Dr. Anitha Rajan",
    duration: 60,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    questions: [
      {
        id: 1,
        text: "What is the time complexity of Binary Search?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correct: 1,
      },
      {
        id: 2,
        text: "Which data structure uses LIFO order?",
        options: ["Queue", "Heap", "Stack", "Tree"],
        correct: 2,
      },
      {
        id: 3,
        text: "What is the worst-case time complexity of QuickSort?",
        options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
        correct: 1,
      },
    ],
  },
  {
    id: 2,
    title: "Operating Systems – Unit Test 1",
    subject: "CS302",
    createdBy: 2,
    createdByName: "Islabudeen M",
    duration: 45,
    createdAt: new Date("2024-01-18T10:30:00Z"),
    questions: [
      {
        id: 1,
        text: "Which scheduling algorithm can cause starvation?",
        options: ["Round Robin", "FCFS", "Priority Scheduling", "SJF"],
        correct: 2,
      },
      {
        id: 2,
        text: "What is a deadlock?",
        options: [
          "A process that runs indefinitely",
          "Two or more processes waiting for each other indefinitely",
          "A memory overflow condition",
          "A CPU scheduling issue",
        ],
        correct: 1,
      },
    ],
  },
];

// ─── PRE-SEEDED SUBMISSIONS (DEFAULTS) ─────────────────────────────
const defaultSubmissions = [
  {
    id: 1,
    examId: 1,
    studentId: 3,
    studentName: "Arun Kumar",
    answers: { 1: 1, 2: 2, 3: 1 },
    score: 3,
    total: 3,
    submittedAt: new Date("2024-01-15T10:00:00Z"),
  },
  {
    id: 2,
    examId: 1,
    studentId: 4,
    studentName: "Prateek Batra",
    answers: { 1: 0, 2: 2, 3: 1 },
    score: 2,
    total: 3,
    submittedAt: new Date("2024-01-15T10:05:00Z"),
  },
];

// ─── LOAD DATA FROM FILES OR USE DEFAULTS ─────────────────────────
let exams = loadExams();
let submissions = loadSubmissions();

// If no saved data, use defaults
if (exams.length === 0) {
  exams = defaultExams;
  saveExams(exams);
}
if (submissions.length === 0) {
  submissions = defaultSubmissions;
  saveSubmissions(submissions);
}

// ─── INITIALIZE COUNTERS BASED ON LOADED DATA ─────────────────────
let examIdCounter = exams.length > 0 ? Math.max(...exams.map((e) => e.id)) + 1 : 3;
let submissionIdCounter = submissions.length > 0 ? Math.max(...submissions.map((s) => s.id)) + 1 : 3;

module.exports = {
  users,
  exams,
  submissions,
  getNextExamId: () => examIdCounter++,
  getNextSubmissionId: () => submissionIdCounter++,
  saveExams,
  saveSubmissions,
};
