import express from "express";
import dotenv from "dotenv";
import pool from "./config/db.js";

dotenv.config();

const app = express();

app.use(express.json());


// ===============================
// ROOT ROUTE
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "VizhaBook API is running",
    });
});


// ===============================
// DATABASE TEST
// ===============================

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        res.status(200).json({
            success: true,
            message: "PostgreSQL connected successfully",
            time: result.rows[0].current_time,
        });

    } catch (error) {

        console.error("Database Error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message,
        });
    }
});


// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 VizhaBook server running on port ${PORT}`);
});