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
            questionId: { 
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            questionText: { 
                type: String,
                required: true
            },
            selectedOption: {
                type: String, 
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
}, { timestamps: true }); 

resultSchema.index({ student: 1, exam: 1 }, { unique: true });

const Result = mongoose.model("Result", resultSchema);

module.exports = Result;
