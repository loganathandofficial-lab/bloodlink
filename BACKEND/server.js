const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 5000;

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
// DATA FILES
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

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, {
        recursive: true
    });
}

function ensureFile(file) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(
            file,
            "[]",
            "utf8"
        );
    }
}

ensureFile(usersFile);
ensureFile(donorsFile);
ensureFile(requestsFile);

// =========================================================
// HELPERS
// =========================================================

function readJSON(file) {
    try {
        if (!fs.existsSync(file)) {
            return [];
        }

        const content =
            fs.readFileSync(
                file,
                "utf8"
            );

        if (!content.trim()) {
            return [];
        }

        const data =
            JSON.parse(content);

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {
        console.error(
            "JSON read error:",
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
            "JSON write error:",
            error
        );

        return false;
    }
}

function normalizePhone(phone) {
    return String(
        phone || ""
    )
        .replace(/\D/g, "")
        .trim();
}

function isValidPhone(phone) {
    return /^[0-9]{10}$/.test(
        normalizePhone(phone)
    );
}

function calculateAge(dob) {
    if (!dob) {
        return null;
    }

    const birthDate =
        new Date(
            `${String(dob).trim()}T00:00:00`
        );

    if (
        Number.isNaN(
            birthDate.getTime()
        )
    ) {
        return null;
    }

    const today = new Date();

    if (birthDate > today) {
        return null;
    }

    let age =
        today.getFullYear() -
        birthDate.getFullYear();

    const monthDifference =
        today.getMonth() -
        birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() <
                birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
}

function isEligibleAge(age) {
    return (
        Number.isInteger(age) &&
        age >= 18 &&
        age <= 65
    );
}

function generateDonorId(donors) {
    let highest = 10000;

    for (const donor of donors) {
        const match =
            String(
                donor.donorId || ""
            ).match(
                /^BL-DON-(\d+)$/
            );

        if (!match) {
            continue;
        }

        const number =
            Number(match[1]);

        if (
            Number.isFinite(number) &&
            number > highest
        ) {
            highest = number;
        }
    }

    return `BL-DON-${highest + 1}`;
}

function generateAdminToken() {
    return crypto
        .randomBytes(32)
        .toString("hex");
}

// =========================================================
// FOUNDER AUTH
// =========================================================

function requireFounderAdmin(
    req,
    res,
    next
) {
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
// HOME
// =========================================================

app.get(
    "/",
    (req, res) => {
        res.send(
            "BloodLink Backend is running!"
        );
    }
);

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
// FOUNDER LOGIN
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
                dob,
                ageVerified
            } = req.body;

            if (
                !name ||
                !email ||
                !password ||
                !phone ||
                !dob
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Name, email, password, mobile number and date of birth are required."
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

            const cleanDob =
                String(dob).trim();

            if (!cleanName) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Full name is required."
                    });
            }

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
                String(password).length <
                6
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Password must contain at least 6 characters."
                    });
            }

            const calculatedAge =
                calculateAge(cleanDob);

            if (
                calculatedAge === null
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Please enter a valid date of birth."
                    });
            }

            if (
                !isEligibleAge(
                    calculatedAge
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            calculatedAge < 18
                                ? "You must be at least 18 years old to register."
                                : "The maximum eligible age is 65 years.",
                        age:
                            calculatedAge,
                        ageVerified:
                            false
                    });
            }

            if (
                ageVerified !== true
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "Please complete age eligibility verification.",
                        age:
                            calculatedAge,
                        ageVerified:
                            false
                    });
            }

            const users =
                readJSON(usersFile);

            const emailExists =
                users.some(
                    user =>
                        String(
                            user.email || ""
                        )
                            .trim()
                            .toLowerCase() ===
                        cleanEmail
                );

            if (emailExists) {
                return res
                    .status(409)
                    .json({
                        success: false,
                        message:
                            "An account with this email already exists."
                    });
            }

            const phoneExists =
                users.some(
                    user =>
                        normalizePhone(
                            user.phone
                        ) ===
                        cleanPhone
                );

            if (phoneExists) {
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
                dob:
                    cleanDob,
                age:
                    calculatedAge,
                ageVerified:
                    true,
                verificationStatus:
                    "Age Verified",
                createdAt:
                    new Date().toISOString()
            };

            users.push(newUser);

            if (
                !writeJSON(
                    usersFile,
                    users
                )
            ) {
                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "Unable to save user data."
                    });
            }

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
                        dob:
                            newUser.dob,
                        age:
                            newUser.age,
                        ageVerified:
                            true,
                        verificationStatus:
                            "Age Verified"
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
                        String(
                            item.email || ""
                        )
                            .trim()
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
                String(
                    user.password || ""
                ) !==
                String(password)
            ) {
                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "Invalid email or password."
                    });
            }

            const userAge =
                Number.isInteger(
                    user.age
                )
                    ? user.age
                    : calculateAge(
                        user.dob
                    );

            const eligible =
                isEligibleAge(
                    userAge
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
                        normalizePhone(
                            user.phone
                        ),
                    dob:
                        user.dob || "",
                    age:
                        userAge,
                    ageVerified:
                        eligible,
                    verificationStatus:
                        user.verificationStatus ||
                        (
                            eligible
                                ? "Age Verified"
                                : "Not Verified"
                        )
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
    requireFounderAdmin,
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
                            normalizePhone(
                                user.phone
                            ),
                        dob:
                            user.dob || "",
                        age:
                            user.age ?? "",
                        ageVerified:
                            user.ageVerified ===
                            true,
                        verificationStatus:
                            user.verificationStatus ||
                            "Not Verified",
                        createdAt:
                            user.createdAt || ""
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
// GET ONE USER
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

            const age =
                Number.isInteger(
                    user.age
                )
                    ? user.age
                    : calculateAge(
                        user.dob
                    );

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
                        normalizePhone(
                            user.phone
                        ),
                    dob:
                        user.dob || "",
                    age:
                        age,
                    ageVerified:
                        isEligibleAge(
                            age
                        ),
                    verificationStatus:
                        user.verificationStatus ||
                        "Not Verified"
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

            const userAge =
                Number.isInteger(
                    user.age
                )
                    ? user.age
                    : calculateAge(
                        user.dob
                    );

            if (
                !isEligibleAge(
                    userAge
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "You are not eligible to register as a blood donor. Donor age must be between 18 and 65 years.",
                        age:
                            userAge,
                        ageVerified:
                            false
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

            const newDonor = {
                id:
                    Date.now().toString(),
                donorId:
                    generateDonorId(
                        donors
                    ),
                userId:
                    String(userId),
                name:
                    String(name).trim(),
                blood:
                    String(blood)
                        .trim()
                        .toUpperCase(),
                city:
                    String(city).trim(),
                phone:
                    registeredPhone,
                age:
                    userAge,
                createdAt:
                    new Date().toISOString()
            };

            donors.push(newDonor);

            if (
                !writeJSON(
                    donorsFile,
                    donors
                )
            ) {
                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "Unable to save donor data."
                    });
            }

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
                            `Dear ${newDonor.name}, you have successfully registered as a blood donor with BloodLink. Your Donor ID is ${newDonor.donorId}.`
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
// SEARCH DONORS
// IMPORTANT: THIS ROUTE COMES BEFORE /:donorId
// =========================================================

app.get(
    "/api/donors/search",
    (req, res) => {
        try {
            const blood =
                String(
                    req.query.blood || ""
                )
                    .trim()
                    .toLowerCase();

            const city =
                String(
                    req.query.city || ""
                )
                    .trim()
                    .toLowerCase();

            const donors =
                readJSON(donorsFile);

            const users =
                readJSON(usersFile);

            const results =
                donors
                    .filter(
                        donor => {

                            const donorBlood =
                                String(
                                    donor.blood ||
                                    donor.bloodGroup ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase();

                            const donorCity =
                                String(
                                    donor.city ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase();

                            const bloodMatch =
                                !blood ||
                                donorBlood ===
                                    blood;

                            const cityMatch =
                                !city ||
                                donorCity.includes(
                                    city
                                );

                            return (
                                bloodMatch &&
                                cityMatch
                            );
                        }
                    )
                    .map(
                        donor => {

                            const linkedUser =
                                users.find(
                                    user =>
                                        String(
                                            user.id
                                        ) ===
                                        String(
                                            donor.userId
                                        )
                                );

                            const donorPhone =
                                normalizePhone(
                                    donor.phone
                                );

                            const accountPhone =
                                linkedUser
                                    ? normalizePhone(
                                        linkedUser.phone
                                    )
                                    : "";

                            const finalPhone =
                                donorPhone ||
                                accountPhone;

                            return {
                                id:
                                    donor.id,
                                donorId:
                                    donor.donorId,
                                userId:
                                    donor.userId,
                                name:
                                    donor.name,
                                blood:
                                    donor.blood ||
                                    donor.bloodGroup ||
                                    "",
                                city:
                                    donor.city ||
                                    "",
                                phone:
                                    finalPhone,
                                age:
                                    donor.age ?? "",
                                createdAt:
                                    donor.createdAt ||
                                    ""
                            };
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
// GET ONE DONOR
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

            const users =
                readJSON(usersFile);

            const linkedUser =
                users.find(
                    user =>
                        String(
                            user.id
                        ) ===
                        String(
                            donor.userId
                        )
                );

            const phone =
                normalizePhone(
                    donor.phone
                ) ||
                normalizePhone(
                    linkedUser
                        ? linkedUser.phone
                        : ""
                );

            return res.json({
                success: true,
                donor: {
                    ...donor,
                    phone:
                        phone
                }
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
                blood ||
                bloodGroup ||
                "";

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

            if (
                !isValidPhone(
                    cleanPhone
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Please enter a valid 10-digit mobile number."
                    });
            }

            const requests =
                readJSON(
                    requestsFile
                );

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
                    )
                        .trim()
                        .toUpperCase(),
                bloodGroup:
                    String(
                        finalBlood
                    )
                        .trim()
                        .toUpperCase(),
                city:
                    String(city).trim(),
                phone:
                    cleanPhone,
                message:
                    String(
                        message || ""
                    ).trim(),
                status:
                    "Active",
                createdAt:
                    new Date().toISOString()
            };

            requests.push(
                newRequest
            );

            if (
                !writeJSON(
                    requestsFile,
                    requests
                )
            ) {
                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "Unable to save blood request."
                    });
            }

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
// GET REQUESTS
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
// DELETE USER
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

            const updatedUsers =
                users.filter(
                    user =>
                        String(
                            user.id
                        ) !==
                        userId
                );

            if (
                updatedUsers.length ===
                users.length
            ) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "User not found."
                    });
            }

            if (
                !writeJSON(
                    usersFile,
                    updatedUsers
                )
            ) {
                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "Unable to delete user."
                    });
            }

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
// DELETE DONOR
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

            const updatedDonors =
                donors.filter(
                    donor =>
                        String(
                            donor.donorId
                        ) !==
                            donorId &&
                        String(
                            donor.id
                        ) !==
                            donorId
                );

            if (
                updatedDonors.length ===
                donors.length
            ) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Donor not found."
                    });
            }

            if (
                !writeJSON(
                    donorsFile,
                    updatedDonors
                )
            ) {
                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "Unable to delete donor."
                    });
            }

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
// DELETE REQUEST
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
                readJSON(
                    requestsFile
                );

            const updatedRequests =
                requests.filter(
                    request =>
                        String(
                            request.id
                        ) !==
                        requestId
                );

            if (
                updatedRequests.length ===
                requests.length
            ) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Blood request not found."
                    });
            }

            if (
                !writeJSON(
                    requestsFile,
                    updatedRequests
                )
            ) {
                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "Unable to delete blood request."
                    });
            }

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
// FOUNDER LOGOUT
// =========================================================

app.post(
    "/api/founder-logout",
    requireFounderAdmin,
    (req, res) => {

        founderAdminToken =
            null;

        return res.json({
            success: true,
            message:
                "Founder admin logged out successfully."
        });
    }
);

// =========================================================
// 404
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
    (
        error,
        req,
        res,
        next
    ) => {

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
            "Founder authentication enabled."
        );

        console.log(
            "Age eligibility: 18-65."
        );

        console.log(
            "Donor phone fallback enabled."
        );

        console.log(
            "========================================"
        );
    }
);