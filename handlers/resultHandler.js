const Result = require("../models/Result");
const Exam = require("../models/Exam");
const User = require("../models/User");

// Utility function for error handling
const handleAsync = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Error handler utility
const AppError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    error.isOperational = true; // Mark as operational error
    return error;
};

// Student: Submit an Exam
exports.submitExam = handleAsync(async (req, res, next) => {
    const { examId, answers } = req.body; // answers should be an array like [{ questionId: "...", selectedOption: "..." }]
    const studentId = req.user._id; // From auth middleware

    if (!examId || !answers || !Array.isArray(answers) || answers.length === 0) {
        return next(new AppError("Exam ID and a non-empty array of answers are required", 400));
    }

    // 1. Fetch the exam with correct answers
    const exam = await Exam.findById(examId);
    if (!exam) {
        return next(new AppError("Exam not found", 404));
    }
    if (!exam.isActive) {
        return next(new AppError("This exam is no longer active", 400));
    }

    // 2. Check if student has already submitted this exam
    const existingResult = await Result.findOne({ student: studentId, exam: examId });
    if (existingResult) {
        return next(new AppError("You have already submitted this exam", 400));
    }

    // 3. Validate and Score the answers
    let score = 0;
    const processedAnswers = [];
    const totalQuestions = exam.questions.length;

    // Create a map for quick lookup of correct answers
    const questionMap = new Map();
    exam.questions.forEach(q => {
        questionMap.set(q._id.toString(), { text: q.text, correctAnswer: q.correctAnswer });
    });

    for (const answer of answers) {
        if (!answer.questionId || !answer.selectedOption) {
             return next(new AppError(`Invalid answer format provided for question ID ${answer.questionId || 'unknown'}`, 400));
        }

        const questionDetails = questionMap.get(answer.questionId);
        if (!questionDetails) {
            console.warn(`Attempted to answer non-existent question ID: ${answer.questionId} in exam ${examId}`);
            // Decide whether to skip or error. Skipping might be more robust.
            continue; // Skip this answer if the question doesn't exist in the exam anymore
        }

        const isCorrect = questionDetails.correctAnswer === answer.selectedOption;
        if (isCorrect) {
            score++;
        }

        processedAnswers.push({
            questionId: answer.questionId,
            questionText: questionDetails.text, // Store text for convenience
            selectedOption: answer.selectedOption,
            isCorrect: isCorrect,
        });
    }

    // Ensure the number of processed answers matches the number submitted (minus skipped invalid ones)
    // This check might be complex if skipping is allowed. A simpler check is against totalQuestions.
    if (processedAnswers.length !== answers.length) {
         // This indicates some answers were skipped due to invalid question IDs
         console.warn(`Some answers were skipped for student ${studentId} on exam ${examId}`);
    }
     // We should probably ensure the student answered *all* questions from the exam
     if (processedAnswers.length !== totalQuestions) {
         // This could happen if the frontend didn't send answers for all questions
         // Or if questions were added/removed between fetching and submitting
         // Depending on requirements, might need to reject or handle partially
         console.warn(`Student ${studentId} submitted ${processedAnswers.length} answers for exam ${examId} which has ${totalQuestions} questions.`);
         // For now, we proceed but log a warning. Stricter validation might be needed.
     }


    // 4. Calculate percentage
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    // 5. Save the result
    const newResult = await Result.create({
        student: studentId,
        exam: examId,
        answers: processedAnswers,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage.toFixed(2), // Store with 2 decimal places
    });

    res.status(201).json({
        status: "success",
        message: "Exam submitted successfully!",
        data: {
            result: newResult, // Send back the detailed result
        },
    });
});

// Student: Get their own results
exports.getMyResults = handleAsync(async (req, res, next) => {
    const results = await Result.find({ student: req.user._id })
                                .populate("exam", "title description") // Populate exam title
                                .select("-answers"); // Exclude detailed answers by default

    res.status(200).json({
        status: "success",
        results: results.length,
        data: {
            results,
        },
    });
});

// Student: Get a specific result details (including answers)
exports.getMyResultDetails = handleAsync(async (req, res, next) => {
    const result = await Result.findOne({ _id: req.params.resultId, student: req.user._id })
                               .populate("exam", "title"); // Populate exam title

    if (!result) {
        return next(new AppError("Result not found or you do not have permission to view it", 404));
    }

    // Optionally fetch the original exam questions to show correct answers alongside student answers
    const exam = await Exam.findById(result.exam._id).select("questions");
    const correctAnswersMap = new Map();
    if (exam) {
        exam.questions.forEach(q => correctAnswersMap.set(q._id.toString(), q.correctAnswer));
    }

    // Augment answers with correct answer info (if needed by frontend)
    const detailedAnswers = result.answers.map(ans => ({
        ...ans.toObject(), // Convert Mongoose subdocument to plain object
        correctAnswer: correctAnswersMap.get(ans.questionId.toString()) || 'N/A'
    }));


    res.status(200).json({
        status: "success",
        data: {
            result: {
                ...result.toObject(), // Convert Mongoose doc to plain object
                answers: detailedAnswers // Replace with augmented answers
            }
        },
    });
});


// Admin: Get all results for a specific exam
exports.getResultsForExam = handleAsync(async (req, res, next) => {
    const results = await Result.find({ exam: req.params.examId })
                                .populate("student", "username email") // Populate student info
                                .select("-answers"); // Exclude detailed answers by default

    res.status(200).json({
        status: "success",
        results: results.length,
        data: {
            results,
        },
    });
});

// Admin: Get specific result details (e.g., a student's result for an exam)
exports.getResultDetailsAdmin = handleAsync(async (req, res, next) => {
    const result = await Result.findById(req.params.resultId)
                               .populate("student", "username email")
                               .populate("exam", "title");

    if (!result) {
        return next(new AppError("Result not found", 404));
    }

     // Optionally fetch the original exam questions to show correct answers alongside student answers
    const exam = await Exam.findById(result.exam._id).select("questions");
    const correctAnswersMap = new Map();
    if (exam) {
        exam.questions.forEach(q => correctAnswersMap.set(q._id.toString(), q.correctAnswer));
    }

    // Augment answers with correct answer info (if needed by frontend)
    const detailedAnswers = result.answers.map(ans => ({
        ...ans.toObject(), // Convert Mongoose subdocument to plain object
        correctAnswer: correctAnswersMap.get(ans.questionId.toString()) || 'N/A'
    }));

    res.status(200).json({
        status: "success",
        data: {
             result: {
                ...result.toObject(), // Convert Mongoose doc to plain object
                answers: detailedAnswers // Replace with augmented answers
            }
        },
    });
});
