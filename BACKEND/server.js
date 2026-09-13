// =========================================================
// BLOODLINK BACKEND SERVER
// Node.js + Express + JSON Storage
// =========================================================

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 5000;

// =========================================================
// FOUNDER ADMIN AUTHENTICATION
// =========================================================

const FOUNDER_USERNAME =
    process.env.BLOODLINK_FOUNDER_USERNAME || "founder";

const FOUNDER_PASSWORD =
    process.env.BLOODLINK_FOUNDER_PASSWORD || "bloodlinkadmin";

let founderAdminToken = null;

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());
app.use(express.json());

// =========================================================
// JSON FILE PATHS
// =========================================================

const dataFolder = path.join(__dirname, "data");

const usersFile = path.join(
    dataFolder,
    "users.json"
);

const donorsFile = path.join(
    dataFolder,
    "donors.json"
);

const requestsFile = path.join(
    dataFolder,
    "requests.json"
);

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
    fs.writeFileSync(
        usersFile,
        "[]",
        "utf8"
    );
}

if (!fs.existsSync(donorsFile)) {
    fs.writeFileSync(
        donorsFile,
        "[]",
        "utf8"
    );
}

if (!fs.existsSync(requestsFile)) {
    fs.writeFileSync(
        requestsFile,
        "[]",
        "utf8"
    );
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
            ),
            "utf8"
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

function normalizePhone(phone) {
    return String(phone || "")
        .replace(/\D/g, "")
        .trim();
}

function isValidPhone(phone) {
    return /^[0-9]{10}$/.test(
        normalizePhone(phone)
    );
}

function generateAdminToken() {
    return crypto
        .randomBytes(32)
        .toString("hex");
}

function requireFounderAdmin(req, res, next) {

    const token =
        req.headers["x-admin-token"];

    if (
        !founderAdminToken ||
        token !== founderAdminToken
    ) {

        return res
            .status(403)
            .json({
                success: false,
                message:
                    "Founder admin access is required."
            });
    }

    next();
}

// =========================================================
// UNIQUE DONOR ID
// =========================================================

function generateDonorId(donors) {

    let highestNumber = 10000;

    donors.forEach(function (donor) {

        const donorId =
            String(
                donor.donorId || ""
            );

        const match =
            donorId.match(
                /^BL-DON-(\d+)$/
            );

        if (match) {

            const number =
                Number(match[1]);

            if (
                Number.isFinite(number) &&
                number > highestNumber
            ) {
                highestNumber = number;
            }
        }
    });

    return `BL-DON-${highestNumber + 1}`;
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

app.get(
    "/api/test",
    (req, res) => {

        res.json({
            success: true,
            message:
                "BloodLink API is working!"
        });
    }
);

// =========================================================
// FOUNDER ADMIN LOGIN
// =========================================================

app.post(
    "/api/founder-login",
    (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;

            if (
                !username ||
                !password
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Founder username and password are required."
                    });
            }

            if (
                String(username).trim() !==
                    FOUNDER_USERNAME ||
                String(password) !==
                    FOUNDER_PASSWORD
            ) {

                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "Invalid founder login."
                    });
            }

            founderAdminToken =
                generateAdminToken();

            console.log(
                "Founder admin logged in."
            );

            return res.json({

                success: true,

                message:
                    "Founder login successful.",

                adminToken:
                    founderAdminToken
            });

        } catch (error) {

            console.error(
                "Founder login error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Unable to process founder login."
                });
        }
    }
);

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
                phone,
                documentUploaded,
                ageVerified,
                verificationStatus
            } = req.body;

            if (
                !name ||
                !email ||
                !password ||
                !phone
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Name, email, password and mobile number are required."
                    });
            }

            const cleanName =
                String(name).trim();

            const cleanEmail =
                String(email)
                    .trim()
                    .toLowerCase();

            const cleanPhone =
                normalizePhone(phone);

            if (!isValidPhone(cleanPhone)) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Please enter a valid 10-digit mobile number."
                    });
            }

            if (
                String(password).length < 6
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Password must contain at least 6 characters."
                    });
            }

            const users =
                readJSON(usersFile);

            const existingUser =
                users.find(
                    user =>
                        user.email &&
                        user.email
                            .toLowerCase() ===
                            cleanEmail
                );

            if (existingUser) {

                return res
                    .status(409)
                    .json({

                        success: false,

                        message:
                            "An account with this email already exists."
                    });
            }

            const existingPhone =
                users.find(
                    user =>
                        normalizePhone(
                            user.phone
                        ) === cleanPhone
                );

            if (existingPhone) {

                return res
                    .status(409)
                    .json({

                        success: false,

                        message:
                            "An account with this mobile number already exists."
                    });
            }

            const newUser = {

                id:
                    Date.now().toString(),

                name:
                    cleanName,

                email:
                    cleanEmail,

                password:
                    String(password),

                phone:
                    cleanPhone,

                documentUploaded:
                    documentUploaded === true,

                ageVerified:
                    ageVerified === true,

                verificationStatus:
                    verificationStatus ||
                    (
                        documentUploaded === true
                            ? "ID Verified"
                            : "Not Verified"
                    ),

                createdAt:
                    new Date().toISOString()
            };

            users.push(
                newUser
            );

            const saved =
                writeJSON(
                    usersFile,
                    users
                );

            if (!saved) {

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            "Unable to save user data."
                    });
            }

            console.log(
                "New user saved:",
                newUser.email
            );

            return res
                .status(201)
                .json({

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

                        phone:
                            newUser.phone,

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

            return res
                .status(500)
                .json({

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

            if (
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Email and password are required."
                    });
            }

            const cleanEmail =
                String(email)
                    .trim()
                    .toLowerCase();

            const users =
                readJSON(usersFile);

            const user =
                users.find(
                    item =>
                        item.email &&
                        item.email
                            .toLowerCase() ===
                            cleanEmail
                );

            if (!user) {

                return res
                    .status(401)
                    .json({

                        success: false,

                        message:
                            "Invalid email or password."
                    });
            }

            if (
                user.password !==
                password
            ) {

                return res
                    .status(401)
                    .json({

                        success: false,

                        message:
                            "Invalid email or password."
                    });
            }

            console.log(
                "User logged in:",
                cleanEmail
            );

            return res.json({

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

                    phone:
                        user.phone || "",

                    documentUploaded:
                        user.documentUploaded === true,

                    ageVerified:
                        user.ageVerified === true,

                    verificationStatus:
                        user.verificationStatus ||
                        "Not Verified"
                }
            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            return res
                .status(500)
                .json({

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

                        phone:
                            user.phone || "",

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

            return res.json({

                success: true,

                users:
                    safeUsers
            });

        } catch (error) {

            console.error(
                "Get users error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Unable to get users."
                });
        }
    }
);

// =========================================================
// GET SINGLE USER
// =========================================================

app.get(
    "/api/users/:userId",
    (req, res) => {

        try {

            const users =
                readJSON(usersFile);

            const user =
                users.find(
                    item =>
                        String(item.id) ===
                        String(
                            req.params.userId
                        )
                );

            if (!user) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "User not found."
                    });
            }

            return res.json({

                success: true,

                user: {

                    id:
                        user.id,

                    name:
                        user.name,

                    email:
                        user.email,

                    phone:
                        user.phone || "",

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
                "Get user error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Unable to get user."
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

            if (
                !userId ||
                !name ||
                !blood ||
                !city
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "User, name, blood group and city are required."
                    });
            }

            const users =
                readJSON(usersFile);

            const user =
                users.find(
                    item =>
                        String(item.id) ===
                        String(userId)
                );

            if (!user) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "User account not found."
                    });
            }

            if (
                user.ageVerified !== true ||
                user.documentUploaded !== true
            ) {

                return res
                    .status(403)
                    .json({

                        success: false,

                        message:
                            "User ID verification is required before donor registration."
                    });
            }

            const registeredPhone =
                normalizePhone(
                    user.phone
                );

            if (
                !isValidPhone(
                    registeredPhone
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "A valid mobile number is not available in the user account."
                    });
            }

            if (
                phone &&
                normalizePhone(phone) !==
                    registeredPhone
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Donor mobile number must match your registered account mobile number."
                    });
            }

            const donors =
                readJSON(donorsFile);

            const existingDonor =
                donors.find(
                    donor =>
                        String(
                            donor.userId
                        ) ===
                        String(userId)
                );

            if (existingDonor) {

                return res
                    .status(409)
                    .json({

                        success: false,

                        message:
                            `You are already registered as a donor. Your Donor ID is ${existingDonor.donorId}.`,

                        donor:
                            existingDonor
                    });
            }

            const donorId =
                generateDonorId(
                    donors
                );

            const newDonor = {

                id:
                    Date.now().toString(),

                donorId:
                    donorId,

                userId:
                    String(userId),

                name:
                    String(name).trim(),

                blood:
                    String(blood).trim(),

                city:
                    String(city).trim(),

                phone:
                    registeredPhone,

                createdAt:
                    new Date().toISOString()
            };

            donors.push(
                newDonor
            );

            const saved =
                writeJSON(
                    donorsFile,
                    donors
                );

            if (!saved) {

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            "Unable to save donor data."
                    });
            }

            console.log(
                "New donor saved:",
                newDonor.donorId,
                newDonor.name
            );

            return res
                .status(201)
                .json({

                    success: true,

                    message:
                        "Donor registered successfully!",

                    donor:
                        newDonor,

                    confirmation: {

                        donorId:
                            newDonor.donorId,

                        name:
                            newDonor.name,

                        phone:
                            newDonor.phone,

                        message:
                            `Dear ${newDonor.name}, you have successfully registered as a blood donor with BloodLink. Your Donor ID is ${newDonor.donorId}. Thank you for using the BloodLink website and helping save lives.`
                    }
                });

        } catch (error) {

            console.error(
                "Donor registration error:",
                error
            );

            return res
                .status(500)
                .json({

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

            return res.json({

                success: true,

                donors:
                    donors
            });

        } catch (error) {

            console.error(
                "Get donors error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Unable to get donors."
                });
        }
    }
);

// =========================================================
// GET SINGLE DONOR
// =========================================================

app.get(
    "/api/donors/:donorId",
    (req, res) => {

        try {

            const donors =
                readJSON(donorsFile);

            const donor =
                donors.find(
                    item =>
                        String(
                            item.donorId
                        ) ===
                        String(
                            req.params.donorId
                        ) ||
                        String(
                            item.id
                        ) ===
                        String(
                            req.params.donorId
                        )
                );

            if (!donor) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Donor not found."
                    });
            }

            return res.json({

                success: true,

                donor:
                    donor
            });

        } catch (error) {

            console.error(
                "Get donor error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Unable to get donor."
                });
        }
    }
);

// =========================================================
// SEARCH DONORS
// BLOOD GROUP + OPTIONAL LOCATION
// =========================================================

app.get(
    "/api/donors/search",
    (req, res) => {

        try {

            const blood =
                String(
                    req.query.blood || ""
                ).trim();

            const city =
                String(
                    req.query.city || ""
                ).trim();

            const donors =
                readJSON(donorsFile);

            const results =
                donors.filter(
                    donor => {

                        const donorBlood =
                            String(
                                donor.blood ||
                                donor.bloodGroup ||
                                ""
                            ).trim();

                        const donorCity =
                            String(
                                donor.city ||
                                ""
                            ).trim();

                        const bloodMatch =
                            !blood ||
                            donorBlood
                                .toLowerCase() ===
                            blood.toLowerCase();

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

            return res.json({

                success: true,

                donors:
                    results
            });

        } catch (error) {

            console.error(
                "Donor search error:",
                error
            );

            return res
                .status(500)
                .json({

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
                bloodGroup,
                city,
                phone,
                message
            } = req.body;

            const finalBlood =
                blood || bloodGroup || "";

            if (
                !requesterName ||
                !finalBlood ||
                !city ||
                !phone
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Name, blood group, city and phone are required."
                    });
            }

            const cleanPhone =
                normalizePhone(phone);

            if (!isValidPhone(cleanPhone)) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Please enter a valid 10-digit mobile number."
                    });
            }

            const requests =
                readJSON(requestsFile);

            const newRequest = {

                id:
                    Date.now().toString(),

                requesterName:
                    String(
                        requesterName
                    ).trim(),

                blood:
                    String(
                        finalBlood
                    ).trim(),

                bloodGroup:
                    String(
                        finalBlood
                    ).trim(),

                city:
                    String(city).trim(),

                phone:
                    cleanPhone,

                message:
                    message
                        ? String(
                            message
                        ).trim()
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

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            "Unable to save blood request."
                    });
            }

            console.log(
                "New blood request saved:",
                newRequest.requesterName
            );

            return res
                .status(201)
                .json({

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

            return res
                .status(500)
                .json({

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
                readJSON(
                    requestsFile
                );

            return res.json({

                success: true,

                requests:
                    requests
            });

        } catch (error) {

            console.error(
                "Get requests error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Unable to get blood requests."
                });
        }
    }
);

// =========================================================
// DELETE USER - FOUNDER ONLY
// =========================================================

app.delete(
    "/api/users/:userId",
    requireFounderAdmin,
    (req, res) => {

        try {

            const userId =
                String(
                    req.params.userId
                );

            const users =
                readJSON(usersFile);

            const originalLength =
                users.length;

            const updatedUsers =
                users.filter(
                    user =>
                        String(user.id) !==
                        userId
                );

            if (
                updatedUsers.length ===
                originalLength
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "User not found."
                    });
            }

            const saved =
                writeJSON(
                    usersFile,
                    updatedUsers
                );

            if (!saved) {

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            "Unable to delete user."
                    });
            }

            console.log(
                "User deleted by founder:",
                userId
            );

            return res.json({

                success: true,

                message:
                    "User deleted successfully."
            });

        } catch (error) {

            console.error(
                "Delete user error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Unable to delete user."
                });
        }
    }
);

// =========================================================
// DELETE DONOR - FOUNDER ONLY
// =========================================================

app.delete(
    "/api/donors/:donorId",
    requireFounderAdmin,
    (req, res) => {

        try {

            const donorId =
                String(
                    req.params.donorId
                );

            const donors =
                readJSON(donorsFile);

            const originalLength =
                donors.length;

            const updatedDonors =
                donors.filter(
                    donor =>
                        String(
                            donor.donorId
                        ) !== donorId &&
                        String(
                            donor.id
                        ) !== donorId
                );

            if (
                updatedDonors.length ===
                originalLength
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Donor not found."
                    });
            }

            const saved =
                writeJSON(
                    donorsFile,
                    updatedDonors
                );

            if (!saved) {

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            "Unable to delete donor."
                    });
            }

            console.log(
                "Donor deleted by founder:",
                donorId
            );

            return res.json({

                success: true,

                message:
                    "Donor deleted successfully."
            });

        } catch (error) {

            console.error(
                "Delete donor error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Unable to delete donor."
                });
        }
    }
);

// =========================================================
// DELETE BLOOD REQUEST - FOUNDER ONLY
// =========================================================

app.delete(
    "/api/requests/:requestId",
    requireFounderAdmin,
    (req, res) => {

        try {

            const requestId =
                String(
                    req.params.requestId
                );

            const requests =
                readJSON(requestsFile);

            const originalLength =
                requests.length;

            const updatedRequests =
                requests.filter(
                    request =>
                        String(
                            request.id
                        ) !== requestId
                );

            if (
                updatedRequests.length ===
                originalLength
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Blood request not found."
                    });
            }

            const saved =
                writeJSON(
                    requestsFile,
                    updatedRequests
                );

            if (!saved) {

                return res
                    .status(500)
                    .json({

                        success: false,

                        message:
                            "Unable to delete blood request."
                    });
            }

            console.log(
                "Blood request deleted by founder:",
                requestId
            );

            return res.json({

                success: true,

                message:
                    "Blood request deleted successfully."
            });

        } catch (error) {

            console.error(
                "Delete request error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Unable to delete blood request."
                });
        }
    }
);

// =========================================================
// FOUNDER ADMIN LOGOUT
// =========================================================

app.post(
    "/api/founder-logout",
    requireFounderAdmin,
    (req, res) => {

        founderAdminToken = null;

        console.log(
            "Founder admin logged out."
        );

        return res.json({

            success: true,

            message:
                "Founder admin logged out successfully."
        });
    }
);

// =========================================================
// 404 ROUTE
// =========================================================

app.use(
    (req, res) => {

        return res
            .status(404)
            .json({

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

        return res
            .status(500)
            .json({

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
            `Data folder: ${dataFolder}`
        );

        console.log(
            "Founder admin authentication enabled."
        );

        console.log(
            "========================================"
        );
    }
);