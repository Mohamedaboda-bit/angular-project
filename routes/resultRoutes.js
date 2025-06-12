const express = require("express");
const resultHandler = require("../handlers/resultHandler");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

<<<<<<< HEAD
router.use(authMiddleware.protect);

router.post("/submit", resultHandler.submitExam); 
router.get("/my", resultHandler.getMyResults); 
router.get("/my/:resultId", resultHandler.getMyResultDetails); 

router.use(authMiddleware.restrictTo("admin"));

router.get("/exam/:examId", resultHandler.getResultsForExam); 
router.get("/:resultId/details", resultHandler.getResultDetailsAdmin); 
=======
// Apply authentication middleware to all routes below
router.use(authMiddleware.protect);

// --- Student Routes ---
router.post("/submit", resultHandler.submitExam); // Submit exam answers
router.get("/my", resultHandler.getMyResults); // Get logged-in student's results summary
router.get("/my/:resultId", resultHandler.getMyResultDetails); // Get details of a specific result for the logged-in student

// --- Admin Routes ---
// Apply admin restriction middleware to all routes below
router.use(authMiddleware.restrictTo("admin"));

router.get("/exam/:examId", resultHandler.getResultsForExam); // Get all results for a specific exam (admin view)
router.get("/:resultId/details", resultHandler.getResultDetailsAdmin); // Get details of any specific result (admin view)
>>>>>>> 1ebb94456f9d55c46580ade58c26d7196910e5e8

module.exports = router;
