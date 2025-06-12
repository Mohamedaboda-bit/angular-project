const express = require("express");
const resultHandler = require("../handlers/resultHandler");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.post("/submit", resultHandler.submitExam); 
router.get("/my", resultHandler.getMyResults); 
router.get("/my/:resultId", resultHandler.getMyResultDetails); 

router.use(authMiddleware.restrictTo("admin"));

router.get("/exam/:examId", resultHandler.getResultsForExam); 
router.get("/:resultId/details", resultHandler.getResultDetailsAdmin); 

module.exports = router;
