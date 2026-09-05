// =========================================================
// BLOODLINK BACKEND SERVER
// Node.js + Express + JSON Storage
// =========================================================

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 5000;

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());
app.use(express.json());

// =========================================================
// JSON FILE PATHS
// =========================================================

const dataFolder = path.join(__dirname, "data");

const usersFile = path.join(dataFolder, "users.json");
const donorsFile = path.join(dataFolder, "donors.json");
const requestsFile = path.join(dataFolder, "requests.json");

// =========================================================
// CREATE DATA FOLDER
// =========================================================

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, {
        recursive: true
    });
}

// =========================================================
// CREATE JSON FILES
// =========================================================

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]");
}

if (!fs.existsSync(donorsFile)) {
    fs.writeFileSync(donorsFile, "[]");
}

if (!fs.existsSync(requestsFile)) {
    fs.writeFileSync(requestsFile, "[]");
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================

function readJSON(file) {
    try {
        const data = fs.readFileSync(
            file,
            "utf8"
        );

        if (!data.trim()) {
            return [];
        }

        const parsedData = JSON.parse(data);

        return Array.isArray(parsedData)
            ? parsedData
            : [];

    } catch (error) {

        console.error(
            "Error reading JSON file:",
            error
        );

        return [];
    }
}


function writeJSON(file, data) {
    try {

        fs.writeFileSync(
            file,
            JSON.stringify(
                data,
                null,
                2
            )
        );

        return true;

    } catch (error) {

        console.error(
            "Error writing JSON file:",
            error
        );

        return false;
    }
}

// =========================================================
// HOME
// =========================================================

app.get("/", (req, res) => {

    res.send(
        "BloodLink Backend is running!"
    );

});

// =========================================================
// API TEST
// =========================================================

app.get("/api/test", (req, res) => {

    res.json({
        success: true,
        message:
            "BloodLink API is working!"
    });

});

// =========================================================
// SIGNUP
// =========================================================

app.post(
    "/api/signup",
    (req, res) => {

        try {

            const {
                name,
                email,
                password,
                documentUploaded
            } = req.body;

            // -----------------------------------------
            // VALIDATION
            // -----------------------------------------

            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Name, email and password are required."
                });

            }

            // -----------------------------------------
            // READ USERS
            // -----------------------------------------

            const users =
                readJSON(usersFile);

            // -----------------------------------------
            // CHECK EXISTING USER
            // -----------------------------------------

            const existingUser =
                users.find(
                    user =>
                        user.email &&
                        user.email.toLowerCase() ===
                        email.toLowerCase()
                );

            if (existingUser) {

                return res.status(409).json({
                    success: false,
                    message:
                        "An account with this email already exists."
                });

            }

            // -----------------------------------------
            // CREATE USER
            // -----------------------------------------

            const newUser = {

                id:
                    Date.now().toString(),

                name:
                    name.trim(),

                email:
                    email.trim().toLowerCase(),

                password,

                documentUploaded:
                    documentUploaded === true,

                ageVerified:
                    documentUploaded === true,

                verificationStatus:
                    documentUploaded === true
                        ? "ID Verified"
                        : "Not Verified",

                createdAt:
                    new Date().toISOString()

            };

            users.push(newUser);

            const saved =
                writeJSON(
                    usersFile,
                    users
                );

            if (!saved) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to save user data."
                });

            }

            console.log(
                "New user saved:",
                newUser.email
            );

            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            res.status(201).json({

                success: true,

                message:
                    "Account created successfully!",

                user: {

                    id:
                        newUser.id,

                    name:
                        newUser.name,

                    email:
                        newUser.email,

                    documentUploaded:
                        newUser.documentUploaded,

                    ageVerified:
                        newUser.ageVerified,

                    verificationStatus:
                        newUser.verificationStatus

                }

            });

        } catch (error) {

            console.error(
                "Signup error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to create account."

            });

        }

    }
);

// =========================================================
// LOGIN
// =========================================================

app.post(
    "/api/login",
    (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            // -----------------------------------------
            // VALIDATION
            // -----------------------------------------

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and password are required."

                });

            }

            // -----------------------------------------
            // READ USERS
            // -----------------------------------------

            const users =
                readJSON(usersFile);

            // -----------------------------------------
            // FIND USER
            // -----------------------------------------

            const user =
                users.find(
                    user =>
                        user.email &&
                        user.email.toLowerCase() ===
                        email.toLowerCase()
                );

            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."

                });

            }

            // -----------------------------------------
            // PASSWORD CHECK
            // -----------------------------------------

            if (
                user.password !==
                password
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."

                });

            }

            console.log(
                "User logged in:",
                email
            );

            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            res.json({

                success: true,

                message:
                    "Login successful!",

                user: {

                    id:
                        user.id,

                    name:
                        user.name,

                    email:
                        user.email,

                    documentUploaded:
                        user.documentUploaded,

                    ageVerified:
                        user.ageVerified,

                    verificationStatus:
                        user.verificationStatus

                }

            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to login."

            });

        }

    }
);

// =========================================================
// GET ALL USERS
// =========================================================

app.get(
    "/api/users",
    (req, res) => {

        try {

            const users =
                readJSON(usersFile);

            const safeUsers =
                users.map(
                    user => ({

                        id:
                            user.id,

                        name:
                            user.name,

                        email:
                            user.email,

                        documentUploaded:
                            user.documentUploaded,

                        ageVerified:
                            user.ageVerified,

                        verificationStatus:
                            user.verificationStatus,

                        createdAt:
                            user.createdAt

                    })
                );

            res.json({

                success: true,

                users:
                    safeUsers

            });

        } catch (error) {

            console.error(
                "Get users error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to get users."

            });

        }

    }
);

// =========================================================
// DONOR REGISTRATION
// =========================================================

app.post(
    "/api/donors",
    (req, res) => {

        try {

            const {
                userId,
                name,
                blood,
                city,
                phone
            } = req.body;

            // -----------------------------------------
            // VALIDATION
            // -----------------------------------------

            if (
                !name ||
                !blood ||
                !city ||
                !phone
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Name, blood group, city and mobile are required."

                });

            }

            // -----------------------------------------
            // READ DONORS
            // -----------------------------------------

            const donors =
                readJSON(donorsFile);

            // -----------------------------------------
            // CREATE DONOR
            // -----------------------------------------

            const newDonor = {

                id:
                    Date.now().toString(),

                userId:
                    userId || "",

                name:
                    name.trim(),

                blood:
                    blood.trim(),

                city:
                    city.trim(),

                phone:
                    phone.trim(),

                createdAt:
                    new Date().toISOString()

            };

            donors.push(newDonor);

            const saved =
                writeJSON(
                    donorsFile,
                    donors
                );

            if (!saved) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to save donor data."

                });

            }

            console.log(
                "New donor saved:",
                newDonor.name
            );

            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            res.status(201).json({

                success: true,

                message:
                    "Donor registered successfully!",

                donor:
                    newDonor

            });

        } catch (error) {

            console.error(
                "Donor registration error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to register donor."

            });

        }

    }
);

// =========================================================
// GET ALL DONORS
// =========================================================

app.get(
    "/api/donors",
    (req, res) => {

        try {

            const donors =
                readJSON(donorsFile);

            res.json({

                success: true,

                donors

            });

        } catch (error) {

            console.error(
                "Get donors error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to get donors."

            });

        }

    }
);

// =========================================================
// SEARCH DONORS
// =========================================================

app.get(
    "/api/donors/search",
    (req, res) => {

        try {

            const blood =
                req.query.blood || "";

            const city =
                req.query.city || "";

            const donors =
                readJSON(donorsFile);

            const results =
                donors.filter(
                    donor => {

                        const donorBlood =
                            donor.blood ||
                            donor.bloodGroup ||
                            "";

                        const donorCity =
                            donor.city ||
                            "";

                        const bloodMatch =
                            !blood ||
                            donorBlood
                                .toLowerCase() ===
                            blood
                                .toLowerCase();

                        const cityMatch =
                            !city ||
                            donorCity
                                .toLowerCase()
                                .includes(
                                    city.toLowerCase()
                                );

                        return (
                            bloodMatch &&
                            cityMatch
                        );

                    }
                );

            res.json({

                success: true,

                donors:
                    results

            });

        } catch (error) {

            console.error(
                "Donor search error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to search donors."

            });

        }

    }
);

// =========================================================
// BLOOD REQUEST
// =========================================================

app.post(
    "/api/requests",
    (req, res) => {

        try {

            const {
                requesterName,
                blood,
                city,
                phone,
                message
            } = req.body;

            // -----------------------------------------
            // VALIDATION
            // -----------------------------------------

            if (
                !requesterName ||
                !blood ||
                !city ||
                !phone
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Name, blood group, city and phone are required."

                });

            }

            // -----------------------------------------
            // READ REQUESTS
            // -----------------------------------------

            const requests =
                readJSON(requestsFile);

            // -----------------------------------------
            // CREATE REQUEST
            // -----------------------------------------

            const newRequest = {

                id:
                    Date.now().toString(),

                requesterName:
                    requesterName.trim(),

                blood:
                    blood.trim(),

                city:
                    city.trim(),

                phone:
                    phone.trim(),

                message:
                    message
                        ? message.trim()
                        : "",

                status:
                    "Active",

                createdAt:
                    new Date().toISOString()

            };

            requests.push(
                newRequest
            );

            const saved =
                writeJSON(
                    requestsFile,
                    requests
                );

            if (!saved) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to save blood request."

                });

            }

            console.log(
                "New blood request saved:",
                newRequest.requesterName
            );

            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            res.status(201).json({

                success: true,

                message:
                    "Blood request submitted successfully!",

                request:
                    newRequest

            });

        } catch (error) {

            console.error(
                "Blood request error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to submit blood request."

            });

        }

    }
);

// =========================================================
// GET BLOOD REQUESTS
// =========================================================

app.get(
    "/api/requests",
    (req, res) => {

        try {

            const requests =
                readJSON(requestsFile);

            res.json({

                success: true,

                requests

            });

        } catch (error) {

            console.error(
                "Get requests error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to get blood requests."

            });

        }

    }
);

// =========================================================
// 404 ROUTE
// =========================================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API route not found."

        });

    }
);

// =========================================================
// ERROR HANDLER
// =========================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Server error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Internal server error."

        });

    }
);

// =========================================================
// START SERVER
// =========================================================

app.listen(
    PORT,
    () => {

        console.log(
            "========================================"
        );

        console.log(
            "       BLOODLINK BACKEND SERVER"
        );

        console.log(
            "========================================"
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            "JSON storage enabled."
        );

        console.log(
            "========================================"
        );

    }
);