const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./donors.db", (err) => {
    if (err) {
        console.error("Database error:", err.message);
    } else {
        console.log("Connected to donors.db");
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS donors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        bloodGroup TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT,
        state TEXT,
        country TEXT,
        latitude REAL,
        longitude REAL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

app.get("/", (req, res) => {
    res.json({
        message: "Blood Donor Backend is running"
    });
});

app.get("/api/donors", (req, res) => {
    db.all(
        "SELECT * FROM donors ORDER BY id DESC",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

app.post("/api/donors", (req, res) => {
    const {
        name,
        bloodGroup,
        phone,
        city,
        state,
        country,
        latitude,
        longitude
    } = req.body;

    if (!name || !bloodGroup || !phone) {
        return res.status(400).json({
            error: "Name, blood group and phone are required"
        });
    }

    const sql = `
        INSERT INTO donors
        (name, bloodGroup, phone, city, state, country, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            name,
            bloodGroup,
            phone,
            city || "",
            state || "",
            country || "",
            latitude || null,
            longitude || null
        ],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Donor registered successfully",
                id: this.lastID
            });
        }
    );
});

app.get("/api/donors/search", (req, res) => {
    const {
        bloodGroup,
        city,
        country
    } = req.query;

    let sql = "SELECT * FROM donors WHERE 1=1";
    const params = [];

    if (bloodGroup) {
        sql += " AND bloodGroup = ?";
        params.push(bloodGroup);
    }

    if (city) {
        sql += " AND city LIKE ?";
        params.push(`%${city}%`);
    }

    if (country) {
        sql += " AND country LIKE ?";
        params.push(`%${country}%`);
    }

    sql += " ORDER BY id DESC";

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(rows);
    });
});

app.delete("/api/donors/:id", (req, res) => {
    db.run(
        "DELETE FROM donors WHERE id = ?",
        [req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Donor not found"
                });
            }

            res.json({
                message: "Donor deleted successfully"
            });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Blood Donor Backend running at http://localhost:${PORT}`);
});