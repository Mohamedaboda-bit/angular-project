const Exam = require("../models/Exam");
const Result = require("../models/Result"); // Needed for deleting related results

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

// Admin: Create a new Exam
exports.createExam = handleAsync(async (req, res, next) => {
    const { title, description, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
        return next(new AppError("Exam title and at least one question are required", 400));
    }

    // Add createdBy field
    const newExam = await Exam.create({
        title,
        description,
        questions,
        createdBy: req.user._id, // Assuming user is attached by auth middleware
    });

    res.status(201).json({
        status: "success",
        data: {
            exam: newExam,
        },
    });
});

// Admin: Get all Exams (can add pagination later)
exports.getAllExamsAdmin = handleAsync(async (req, res, next) => {
    const exams = await Exam.find().populate("createdBy", "username email"); // Populate creator info

    res.status(200).json({
        status: "success",
        results: exams.length,
        data: {
            exams,
        },
    });
});

// Admin: Get a single Exam by ID (including questions)
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

// Admin: Update an Exam (title, description, isActive status)
exports.updateExam = handleAsync(async (req, res, next) => {
    // Only allow updating title, description, isActive. Questions are handled separately.
    const allowedUpdates = { title: req.body.title, description: req.body.description, isActive: req.body.isActive };
    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

    const exam = await Exam.findByIdAndUpdate(req.params.id, allowedUpdates, {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators
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

// Admin: Delete an Exam
exports.deleteExam = handleAsync(async (req, res, next) => {
    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
        return next(new AppError("No exam found with that ID", 404));
    }

    // Optional: Delete related results as well
    await Result.deleteMany({ exam: req.params.id });

    res.status(204).json({ // 204 No Content
        status: "success",
        data: null,
    });
});

// --- Question Management (within an Exam) ---

// Admin: Add a question to an Exam
exports.addQuestion = handleAsync(async (req, res, next) => {
    const examId = req.params.id;
    const { text, options, correctAnswer } = req.body;

    if (!text || !options || options.length < 2 || !correctAnswer) {
        return next(new AppError("Question text, at least two options, and a correct answer are required", 400));
    }

    // Validate correctAnswer is one of the options
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

// Admin: Update a question within an Exam
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

    // Update fields if provided
    if (text) question.text = text;
    if (options) {
        if (options.length < 2) return next(new AppError("Questions must have at least two options", 400));
        question.options = options;
        // If options change, ensure correctAnswer is still valid or update it
        if (correctAnswer && !options.includes(correctAnswer)) {
             return next(new AppError("Correct answer must be one of the provided options", 400));
        }
         if (correctAnswer) question.correctAnswer = correctAnswer;
         else if (!options.includes(question.correctAnswer)) {
             // If old correct answer is no longer valid and no new one provided, error out or clear it
             return next(new AppError("Options updated, but the existing correct answer is no longer valid. Please provide a new correct answer.", 400));
         }
    } else if (correctAnswer) {
        // Only updating correct answer, ensure it's in existing options
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

// Admin: Delete a question from an Exam
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

    // Use Mongoose 6+ pull method for subdocuments
    exam.questions.pull({ _id: questionId });
    // Or for older Mongoose versions:
    // question.remove();

    await exam.save();

    res.status(204).json({
        status: "success",
        data: null,
    });
});

// --- Student Exam Taking ---

// Student: Get list of available (active) exams
exports.getAvailableExams = handleAsync(async (req, res, next) => {
    const exams = await Exam.find({ isActive: true }).select("title description createdAt"); // Select only needed fields

    res.status(200).json({
        status: "success",
        results: exams.length,
        data: {
            exams,
        },
    });
});

// Student: Get a specific active exam to take (only title, description, questions - without answers)
exports.getExamForTaking = handleAsync(async (req, res, next) => {
    const exam = await Exam.findOne({ _id: req.params.id, isActive: true })
                           .select("title description questions.text questions.options questions._id"); // Exclude correct answers

    if (!exam) {
        return next(new AppError("No active exam found with that ID or exam is not available", 404));
    }

    // Optional: Shuffle questions/options here if needed

    res.status(200).json({
        status: "success",
        data: {
            exam,
        },
    });
});

