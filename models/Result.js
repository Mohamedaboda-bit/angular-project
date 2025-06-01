const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
    },
    answers: [
        {
            questionId: { // Store the _id of the question from the Exam's questions array
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            questionText: { // Store text for easier display, though redundant
                type: String,
                required: true
            },
            selectedOption: {
                type: String, // Store the answer selected by the student
                required: true
            },
            isCorrect: {
                type: Boolean,
                required: true
            }
        }
    ],
    score: {
        type: Number,
        required: true,
        min: 0,
    },
    totalQuestions: {
        type: Number,
        required: true,
        min: 0
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }
}, { timestamps: true }); // Adds createdAt and updatedAt

// Ensure a student can take a specific exam only once
resultSchema.index({ student: 1, exam: 1 }, { unique: true });

const Result = mongoose.model("Result", resultSchema);

module.exports = Result;
