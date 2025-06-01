const mongoose = require("mongoose");

// Embedded schema for questions within an exam
const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, "Question text is required"],
        trim: true,
    },
    options: {
        type: [String],
        required: [true, "Question options are required"],
        validate: [arrayLimit, "{PATH} must have at least 2 options"],
    },
    correctAnswer: {
        type: String, // Store the correct option text or index (ensure consistency in handler)
        required: [true, "Correct answer is required"],
    },
});

function arrayLimit(val) {
    return val.length >= 2;
}

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Exam title is required"],
        trim: true,
        unique: true, // Assuming exam titles should be unique
    },
    description: {
        type: String,
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    questions: [questionSchema], // Embed the questions
    isActive: {
        type: Boolean,
        default: true, // Control if the exam is available for students
    }
}, { timestamps: true });

const Exam = mongoose.model("Exam", examSchema);

module.exports = Exam;
