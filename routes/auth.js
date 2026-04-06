import express from "express";
import { getConnection } from "../db.js";
import oracledb from "oracledb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    let conn;
    try {
        conn = await getConnection();
        const result = await conn.execute(
            `select user_id, name, user_type, password from users where email = :email`,
            { email },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (result.rows.length !== 1) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.PASSWORD);
        if (!match) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign(
            { userId: user.USER_ID, userType: user.USER_TYPE },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );
        res.json({ ok: true, token, redirect: "/dashboard.html" });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        if (conn) await conn.close();
    }
});

router.post("/signup", async (req, res) => {
    const { name, email, password, user_type, department, batch } = req.body;
    let conn;
    try {
        const hashed = await bcrypt.hash(password, 12);
        conn = await getConnection();
        const result = await conn.execute(
            `insert into users (name, email, password, user_type, department, batch) values (:name, :email, :password, :user_type, :department, :batch)`,
            { name, email, password: hashed, user_type, department, batch },
            { autoCommit: true }
        );
        if (result.rowsAffected === 1) {
            res.json({ ok: true });
        } else {
            res.status(400).json({ message: "Invalid fields / Error in insertion" });
        }
    } catch (err) {
        if (err.message?.includes("ORA-00001")) {
            res.status(409).json({ message: "email_taken" });
        } else {
            console.error("Signup Error:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    } finally {
        if (conn) await conn.close();
    }
});

// Protected: get own user info from token
router.get("/me", requireAuth, async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const result = await conn.execute(
            `select user_id, name, user_type from users where user_id = :id`,
            { id: req.user.id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (err) {
        console.error("Fetch User Error:", err);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        if (conn) await conn.close();
    }
});

router.post("/change-password", requireAuth, async (req, res) => {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    if (!current_password || !new_password) {
        return res.status(400).json({ message: "All fields are required." });
    }
    if (new_password.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    let conn;
    try {
        conn = await getConnection();
        const check = await conn.execute(
            `SELECT password FROM users WHERE user_id = :user_id`,
            { user_id: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        const match = await bcrypt.compare(current_password, check.rows[0].PASSWORD);
        if (!match) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }
        const hashed = await bcrypt.hash(new_password, 12);
        await conn.execute(
            `UPDATE users SET password = :new_password WHERE user_id = :user_id`,
            { new_password: hashed, user_id: userId },
            { autoCommit: true }
        );
        res.json({ ok: true, message: "Password updated successfully." });
    } catch (err) {
        console.error("Change Password Error:", err);
        res.status(500).json({ message: "Internal server error." });
    } finally {
        if (conn) await conn.close();
    }
});

export default router;
