/**
 * One-time migration: hash all plaintext passwords in the users table.
 * Run with: node migrate_passwords.js
 * Safe to re-run — already-hashed passwords are skipped.
 */

import oracledb from "oracledb";
import bcrypt from "bcryptjs";

const DB = {
    user: "sagnik",
    password: "sagnik123",
    connectString: "localhost:1521/XEPDB1"
};

async function migrate() {
    let conn;
    try {
        conn = await oracledb.getConnection(DB);

        const { rows } = await conn.execute(
            `SELECT user_id, email, password FROM users`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log(`Found ${rows.length} users to check.\n`);

        let migrated = 0;
        let skipped  = 0;

        for (const user of rows) {
            const pw = user.PASSWORD;

            // bcrypt hashes always start with $2a$ or $2b$
            if (pw && pw.startsWith("$2")) {
                console.log(`  SKIP  [${user.EMAIL}] — already hashed`);
                skipped++;
                continue;
            }

            const hashed = await bcrypt.hash(pw, 12);
            await conn.execute(
                `UPDATE users SET password = :hashed WHERE user_id = :id`,
                { hashed, id: user.USER_ID },
                { autoCommit: true }
            );
            console.log(`  DONE  [${user.EMAIL}] — password hashed`);
            migrated++;
        }

        console.log(`\nMigration complete. ${migrated} hashed, ${skipped} skipped.`);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        if (conn) await conn.close();
    }
}

migrate();
