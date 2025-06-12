const express = require("express");
const cors = require("cors");
const path = require("path");

const authRouter = require("./routes/authRoutes");
const examRouter = require("./routes/examRoutes");
const resultRouter = require("./routes/resultRoutes");

const { notFoundHandler, errorHandler } = require("./middlewares/error-handler");

const app = express();

app.use(cors());

app.use(express.json({ limit: "10kb" })); 
app.use(express.urlencoded({ extended: true, limit: "10kb" })); 

app.get("/", (req, res) => {
    res.send("Exam System Backend is running!");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/exams", examRouter);
app.use("/api/v1/results", resultRouter);

app.all("/", notFoundHandler);

app.use(errorHandler);

module.exports = app;
