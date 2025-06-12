const Exam = require("../models/Exam");     
const Result = require("../models/Result"); 
const AppError = require("../utils/errors");

const handleAsync = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

exports.createExam = handleAsync(async (req, res, next) => {
    const { title, description, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
        return next(new AppError("Exam title and at least one question are required", 400));
    }

    const newExam = await Exam.create({
        title,
        description,
        questions,
        createdBy: req.user._id, 
    });

    res.status(201).json({
        status: "success",
        data: {
            exam: newExam,
        },
    });
});

exports.getAllExamsAdmin = handleAsync(async (req, res, next) => {
    const exams = await Exam.find().populate("createdBy", "username email"); 

    res.status(200).json({
        status: "success",
        results: exams.length,
        data: {
            exams,
        },
    });
});

exports.getExamAdmin = handleAsync(async (req, res, next) => {
    const exam = await Exam.findById(req.params.id).populate("createdBy", "username email");

    if (!exam) {
        return next(new AppError("No exam found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            exam,
        },
    });
});

exports.updateExam = handleAsync(async (req, res, next) => {
    const allowedUpdates = { title: req.body.title, description: req.body.description, isActive: req.body.isActive };
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

    const exam = await Exam.findByIdAndUpdate(req.params.id, allowedUpdates, {
        new: true, 
        runValidators: true, 
    });

    if (!exam) {
        return next(new AppError("No exam found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            exam,
        },
    });
});

exports.deleteExam = handleAsync(async (req, res, next) => {
    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
        return next(new AppError("No exam found with that ID", 404));
    }

    await Result.deleteMany({ exam: req.params.id });

    res.status(204).json({
        status: "success",
        data: null,
    });

});


exports.addQuestion = handleAsync(async (req, res, next) => {
    const examId = req.params.id;
    const { text, options, correctAnswer } = req.body;

    if (!text || !options || options.length < 2 || !correctAnswer) {
        return next(new AppError("Question text, at least two options, and a correct answer are required", 400));
    }

    if (!options.includes(correctAnswer)) {
         return next(new AppError("Correct answer must be one of the provided options", 400));
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
        return next(new AppError("No exam found with that ID", 404));
    }

    exam.questions.push({ text, options, correctAnswer });
    await exam.save();

    res.status(201).json({
        status: "success",
        data: {
            exam,
        },
    });
});

exports.updateQuestion = handleAsync(async (req, res, next) => {
    const { examId, questionId } = req.params;
    const { text, options, correctAnswer } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
        return next(new AppError("No exam found with that ID", 404));
    }

    const question = exam.questions.id(questionId);
    if (!question) {
        return next(new AppError("No question found with that ID within this exam", 404));
    }

    if (text) question.text = text;
    if (options) {
        if (options.length < 2) return next(new AppError("Questions must have at least two options", 400));
        question.options = options;
        if (correctAnswer && !options.includes(correctAnswer)) {
             return next(new AppError("Correct answer must be one of the provided options", 400));
        }
         if (correctAnswer) question.correctAnswer = correctAnswer;
         else if (!options.includes(question.correctAnswer)) {
             return next(new AppError("Options updated, but the existing correct answer is no longer valid. Please provide a new correct answer.", 400));
         }
    } else if (correctAnswer) {
        if (!question.options.includes(correctAnswer)) {
            return next(new AppError("Correct answer must be one of the existing options", 400));
        }
        question.correctAnswer = correctAnswer;
    }


    await exam.save();

    res.status(200).json({
        status: "success",
        data: {
            question,
        },
    });
});

exports.deleteQuestion = handleAsync(async (req, res, next) => {
    const { examId, questionId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
        return next(new AppError("No exam found with that ID", 404));
    }

    const question = exam.questions.id(questionId);
    if (!question) {
        return next(new AppError("No question found with that ID within this exam", 404));
    }

    exam.questions.pull({ _id: questionId });

    await exam.save();

    res.status(204).json({
        status: "success",
        data: null,
    });
});


exports.getAvailableExams = handleAsync(async (req, res, next) => {
    const exams = await Exam.find({ isActive: true });
    const examsWithQuestionCount = exams.map(exam => {
        const examObj = exam.toObject();
        examObj.questions = examObj.questions.length;
        return examObj;
    });
    console.log(examsWithQuestionCount);

    res.status(200).json({
        status: "success",
        results: examsWithQuestionCount.length,
        data: {
            exams: examsWithQuestionCount,
        },
    });
});

exports.getExamForTaking = handleAsync(async (req, res, next) => {
    const exam = await Exam.findOne({ _id: req.params.id, isActive: true })
                           .select("title description questions.text questions.options questions._id"); 

    if (!exam) {
        return next(new AppError("No active exam found with that ID or exam is not available", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            exam,
        },
    });
});

