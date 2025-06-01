const express = require("express");
const examHandler = require("../handlers/examHandler");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply authentication middleware to all routes below
router.use(authMiddleware.protect);

// --- Student Routes ---
router.get("/available", examHandler.getAvailableExams); // Get list of active exams
router.get("/:id/take", examHandler.getExamForTaking); // Get specific exam details for taking (no answers)

// --- Admin Routes ---
// Apply admin restriction middleware to all routes below
router.use(authMiddleware.restrictTo("admin"));

router.route("/")
    .post(examHandler.createExam) // Create a new exam
    .get(examHandler.getAllExamsAdmin); // Get all exams (admin view)

router.route("/:id")
    .get(examHandler.getExamAdmin) // Get single exam details (admin view)
    .patch(examHandler.updateExam) // Update exam metadata (title, description, isActive)
    .delete(examHandler.deleteExam); // Delete an exam

// Question Management Routes (nested under exam)
router.post("/:id/questions", examHandler.addQuestion); // Add a question to an exam
router.route("/:examId/questions/:questionId")
    .patch(examHandler.updateQuestion) // Update a specific question
    .delete(examHandler.deleteQuestion); // Delete a specific question

module.exports = router;
