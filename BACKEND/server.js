const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ===============================
// JSON FILE PATHS
// ===============================

const dataFolder = path.join(__dirname, "data");

const usersFile = path.join(dataFolder, "users.json");
const donorsFile = path.join(dataFolder, "donors.json");
const requestsFile = path.join(dataFolder, "requests.json");

// Create data folder if it does not exist
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

// Create JSON files if they do not exist
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]");
}

if (!fs.existsSync(donorsFile)) {
    fs.writeFileSync(donorsFile, "[]");
}

if (!fs.existsSync(requestsFile)) {
    fs.writeFileSync(requestsFile, "[]");
}

// ===============================
// HELPER FUNCTIONS
// ===============================

function readJSON(file) {
    try {
        const data = fs.readFileSync(file, "utf8");

        if (!data.trim()) {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading JSON file:", error);
        return [];
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.send("BloodLink Backend is running!");
});

// ===============================
// API TEST
// ===============================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "BloodLink API is working!"
    });
});

// ===============================
// SIGNUP
// ===============================

app.post("/api/signup", (req, res) => {
    try {
        const { name, email, password, documentUploaded } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        const users = readJSON(usersFile);

        const existingUser = users.find(
            user => user.email.toLowerCase() === email.toLowerCase()
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            documentUploaded: documentUploaded === true,
            ageVerified: documentUploaded === true,
            verificationStatus: documentUploaded === true
                ? "ID Verified"
                : "Not Verified",
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        writeJSON(usersFile, users);

        console.log("New user saved:", email);

        res.status(201).json({
            success: true,
            message: "Account created successfully!",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                documentUploaded: newUser.documentUploaded,
                ageVerified: newUser.ageVerified,
                verificationStatus: newUser.verificationStatus
            }
        });

    } catch (error) {
        console.error("Signup error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create account."
        });
    }
});

// ===============================
// LOGIN
// ===============================

app.post("/api/login", (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const users = readJSON(usersFile);

        const user = users.find(
            user => user.email.toLowerCase() === email.toLowerCase()
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        console.log("User logged in:", email);

        res.json({
            success: true,
            message: "Login successful!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                documentUploaded: user.documentUploaded,
                ageVerified: user.ageVerified,
                verificationStatus: user.verificationStatus
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to login."
        });
    }
});

// ===============================
// GET ALL USERS
// ===============================

app.get("/api/users", (req, res) => {
    const users = readJSON(usersFile);

    const safeUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        documentUploaded: user.documentUploaded,
        ageVerified: user.ageVerified,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt
    }));

    res.json({
        success: true,
        users: safeUsers
    });
});

// ===============================
// DONOR REGISTRATION
// ===============================

app.post("/api/donors", (req, res) => {
    try {
        const {
            name,
            bloodGroup,
            city,
            mobile,
            email
        } = req.body;

        if (!name || !bloodGroup || !city || !mobile) {
            return res.status(400).json({
                success: false,
                message: "Name, blood group, city and mobile are required."
            });
        }

        const donors = readJSON(donorsFile);

        const newDonor = {
            id: Date.now().toString(),
            name,
            bloodGroup,
            city,
            mobile,
            email: email || "",
            createdAt: new Date().toISOString()
        };

        donors.push(newDonor);

        writeJSON(donorsFile, donors);

        console.log("New donor saved:", name);

        res.status(201).json({
            success: true,
            message: "Donor registered successfully!",
            donor: newDonor
        });

    } catch (error) {
        console.error("Donor registration error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to register donor."
        });
    }
});

// ===============================
// GET ALL DONORS
// ===============================

app.get("/api/donors", (req, res) => {
    const donors = readJSON(donorsFile);

    res.json({
        success: true,
        donors
    });
});

// ===============================
// SEARCH DONORS
// ===============================

app.get("/api/donors/search", (req, res) => {
    try {
        const blood = req.query.blood || "";
        const city = req.query.city || "";

        const donors = readJSON(donorsFile);

        const results = donors.filter(donor => {
            const bloodMatch =
                !blood ||
                donor.bloodGroup.toLowerCase() === blood.toLowerCase();

            const cityMatch =
                !city ||
                donor.city.toLowerCase().includes(city.toLowerCase());

            return bloodMatch && cityMatch;
        });

        res.json({
            success: true,
            donors: results
        });

    } catch (error) {
        console.error("Donor search error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to search donors."
        });
    }
});

// ===============================
// BLOOD REQUEST
// ===============================

app.post("/api/requests", (req, res) => {
    try {
        const {
            requesterName,
            bloodGroup,
            city,
            phone,
            message
        } = req.body;

        if (!requesterName || !bloodGroup || !city || !phone) {
            return res.status(400).json({
                success: false,
                message: "Name, blood group, city and phone are required."
            });
        }

        const requests = readJSON(requestsFile);

        const newRequest = {
            id: Date.now().toString(),
            requesterName,
            bloodGroup,
            city,
            phone,
            message: message || "",
            status: "Active",
            createdAt: new Date().toISOString()
        };

        requests.push(newRequest);

        writeJSON(requestsFile, requests);

        console.log("New blood request saved:", requesterName);

        res.status(201).json({
            success: true,
            message: "Blood request submitted successfully!",
            request: newRequest
        });

    } catch (error) {
        console.error("Blood request error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to submit blood request."
        });
    }
});

// ===============================
// GET BLOOD REQUESTS
// ===============================

app.get("/api/requests", (req, res) => {
    const requests = readJSON(requestsFile);

    res.json({
        success: true,
        requests
    });
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log("========================================");
    console.log("       BLOODLINK BACKEND SERVER");
    console.log("========================================");
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("JSON storage enabled.");
    console.log("========================================");
});