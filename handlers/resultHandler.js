const Result = require("../models/Result");
const Exam = require("../models/Exam");
const User = require("../models/User");
const {
  ExamNotFoundError,
  ExamSubmissionError,
  ValidationError,
  ExamAlreadySubmittedError
} = require("../utils/error-types");


const handleAsync = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

exports.submitExam = handleAsync(async (req, res, next) => {
    const { examId, answers } = req.body; 
    const studentId = req.user._id; 

    if (!examId || !answers || !Array.isArray(answers) || answers.length === 0) {
        return next(new ValidationError("Exam ID and a non-empty array of answers are required"));
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
        return next(new ExamNotFoundError());
    }
    if (!exam.isActive) {
        return next(new ExamSubmissionError("This exam is no longer active"));
    }

    const existingResult = await Result.findOne({ student: studentId, exam: examId });
    if (existingResult) {
        return next(new ExamAlreadySubmittedError());
    }

    let score = 0;
    const processedAnswers = [];
    const totalQuestions = exam.questions.length;

    const questionMap = new Map();
    exam.questions.forEach(q => {
        questionMap.set(q._id.toString(), { text: q.text, correctAnswer: q.correctAnswer });
    });

    for (const answer of answers) {
        if (!answer.questionId || !answer.selectedOption) {
             return next(new ValidationError(`Invalid answer format provided for question ID ${answer.questionId || 'unknown'}`));
        }

        const questionDetails = questionMap.get(answer.questionId);
        if (!questionDetails) {
            console.warn(`Attempted to answer non-existent question ID: ${answer.questionId} in exam ${examId}`);
            continue; 
        }

        const isCorrect = questionDetails.correctAnswer === answer.selectedOption;
        if (isCorrect) {
            score++;
        }

        processedAnswers.push({
            questionId: answer.questionId,
            questionText: questionDetails.text, 
            selectedOption: answer.selectedOption,
            isCorrect: isCorrect,
        });
    }

    if (processedAnswers.length !== answers.length) {
         console.warn(`Some answers were skipped for student ${studentId} on exam ${examId}`);
    }
     if (processedAnswers.length !== totalQuestions) {
         console.warn(`Student ${studentId} submitted ${processedAnswers.length} answers for exam ${examId} which has ${totalQuestions} questions.`);
     }


    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const newResult = await Result.create({
        student: studentId,
        exam: examId,
        answers: processedAnswers,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage.toFixed(2), 
    });

    res.status(201).json({
        status: "success",
        message: "Exam submitted successfully!",
        data: {
            result: newResult, 
        },
    });
});

exports.getMyResults = handleAsync(async (req, res, next) => {
    const results = await Result.find({ student: req.user._id })
                                .populate("exam", "title description") 
                                .select("-answers"); 

    res.status(200).json({
        status: "success",
        results: results.length,
        data: {
            results,
        },
    });
});

exports.getMyResultDetails = handleAsync(async (req, res, next) => {
    const result = await Result.findOne({ _id: req.params.resultId, student: req.user._id })
                               .populate("exam", "title"); 

    if (!result) {
        return next(new ValidationError("Result not found or you do not have permission to view it"));
    }

    const exam = await Exam.findById(result.exam._id).select("questions");
    const correctAnswersMap = new Map();
    if (exam) {
        exam.questions.forEach(q => correctAnswersMap.set(q._id.toString(), q.correctAnswer));
    }

    const detailedAnswers = result.answers.map(ans => ({
       
        correctAnswer: correctAnswersMap.get(ans.questionId.toString()) || 'N/A'
    }));


    res.status(200).json({
        status: "success",
        data: {
            result: {
                ...result.toObject(), 
                answers: detailedAnswers 
            }
        },
    });
});



exports.getResultsForExam = handleAsync(async (req, res, next) => {
    const results = await Result.find({ exam: req.params.examId })
                                .populate("student", "username email")
                                .populate("exam", "title") 
                                .select("-answers"); 
    res.status(200).json({
        status: "success",
        results: results.length,
        data: {
            results,
        },
    });
});

exports.getResultDetailsAdmin = handleAsync(async (req, res, next) => {
    const result = await Result.findById(req.params.resultId)
                               .populate("student", "username email")
                               .populate("exam", "title");
    if (!result) {
        return next(new ValidationError("Result not found"));
    }

    const exam = await Exam.findById(result.exam._id).select("questions");
    const correctAnswersMap = new Map();
    if (exam) {
        exam.questions.forEach(q => correctAnswersMap.set(q._id.toString(), q.correctAnswer));
    }

    const detailedAnswers = result.answers.map(ans => ({
        ...ans.toObject(), 
        correctAnswer: correctAnswersMap.get(ans.questionId.toString()) || 'N/A'
    }));

    res.status(200).json({
        status: "success",
        data: {
             result: {
                ...result.toObject(), 
                answers: detailedAnswers 
            }
        },
    });
});
