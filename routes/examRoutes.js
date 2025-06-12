const express = require("express");
const examHandler = require("../handlers/examHandler");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/available", examHandler.getAvailableExams); 
router.get("/:id/take", examHandler.getExamForTaking); 

router.use(authMiddleware.restrictTo("admin"));

router.route("/")
    .post(examHandler.createExam) 
    .get(examHandler.getAllExamsAdmin); 

router.route("/:id")
    .get(examHandler.getExamAdmin) 
    .patch(examHandler.updateExam) 
    .delete(examHandler.deleteExam); 

router.post("/:id/questions", examHandler.addQuestion); 
router.route("/:examId/questions/:questionId")
    .patch(examHandler.updateQuestion) 
    .delete(examHandler.deleteQuestion); 

module.exports = router;
