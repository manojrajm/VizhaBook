import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import functionRoutes from "./routes/functionRoutes.js";
import moiRoutes from "./routes/moiRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import paymentMethodRoutes from "./routes/paymentMethodRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// API ROUTES
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/functions", functionRoutes);
app.use("/api/moi", moiRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api", paymentMethodRoutes);

// ===============================
// ROOT ROUTE
// ===============================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "VizhaBook API Backend is running smoothly",
        endpoints: {
            auth: "/api/auth",
            functions: "/api/functions",
            moi: "/api/moi",
            expenses: "/api/expenses",
            reports: "/api/reports",
            testDb: "/api/test-db"
        }
    });
});

// ===============================
// DATABASE TEST ROUTE
// ===============================
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");
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