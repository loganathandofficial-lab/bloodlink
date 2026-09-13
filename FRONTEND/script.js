// =========================================================
// BLOODLINK FRONTEND JAVASCRIPT
// Local Node.js backend + JSON storage
// =========================================================

const API_URL = "http://localhost:5000/api";
const LOGGED_IN_USER_KEY = "bloodlink_logged_in_user";
const DONOR_ID_KEY = "bloodlink_donor_id";

// =========================================================
// COMMON HELPERS
// =========================================================

function saveLoggedInUser(user) {
    localStorage.setItem(
        LOGGED_IN_USER_KEY,
        JSON.stringify(user)
    );
}

function getLoggedInUser() {
    const raw =
        localStorage.getItem(
            LOGGED_IN_USER_KEY
        );

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error(
            "Login session error:",
            error
        );
        return null;
    }
}

function showMessage(
    element,
    message,
    color
) {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.style.color = color;
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

// =========================================================
// AADHAAR CAMERA SCANNER
// DEMO DOCUMENT SCANNING ONLY
// =========================================================

let cameraStream = null;

const cameraStartButton =
    document.getElementById(
        "startAadhaarCamera"
    );

const cameraStopButton =
    document.getElementById(
        "stopAadhaarCamera"
    );

const cameraCaptureButton =
    document.getElementById(
        "captureAadhaarButton"
    );

const chooseFileButton =
    document.getElementById(
        "chooseAadhaarFile"
    );

const aadhaarInput =
    document.getElementById(
        "aadhaarDocument"
    );

const cameraBox =
    document.getElementById(
        "aadhaarCameraBox"
    );

const cameraVideo =
    document.getElementById(
        "aadhaarCamera"
    );

const cameraCanvas =
    document.getElementById(
        "aadhaarCanvas"
    );

const selectedFileLabel =
    document.getElementById(
        "aadhaarSelectedFile"
    );

const verificationMessage =
    document.getElementById(
        "ageVerificationMessage"
    );

async function startCamera() {
    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {
        showMessage(
            verificationMessage,
            "Camera is not supported by this browser.",
            "#d00037"
        );

        return;
    }

    try {
        stopCamera();

        cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: {
                        ideal: "environment"
                    },
                    width: {
                        ideal: 1920
                    },
                    height: {
                        ideal: 1080
                    }
                },
                audio: false
            });

        if (cameraVideo) {
            cameraVideo.srcObject =
                cameraStream;

            cameraVideo.muted = true;

            await cameraVideo.play();
        }

        if (cameraBox) {
            cameraBox.hidden = false;
        }

        showMessage(
            verificationMessage,
            "📷 Camera ready. Place the Aadhaar document clearly inside the frame.",
            "#8a5a00"
        );

    } catch (error) {
        console.error(
            "Camera error:",
            error
        );

        showMessage(
            verificationMessage,
            "✕ Camera permission was denied or the camera is unavailable.",
            "#d00037"
        );
    }
}

function stopCamera() {
    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(function (track) {
                track.stop();
            });

        cameraStream = null;
    }

    if (cameraVideo) {
        cameraVideo.srcObject = null;
    }

    if (cameraBox) {
        cameraBox.hidden = true;
    }
}

function captureCameraFile() {
    return new Promise(
        function (resolve, reject) {

            if (
                !cameraVideo ||
                !cameraCanvas
            ) {
                reject(
                    new Error(
                        "Camera is not available."
                    )
                );

                return;
            }

            const width =
                cameraVideo.videoWidth;

            const height =
                cameraVideo.videoHeight;

            if (!width || !height) {
                reject(
                    new Error(
                        "Camera is not ready."
                    )
                );

                return;
            }

            cameraCanvas.width = width;
            cameraCanvas.height = height;

            const context =
                cameraCanvas.getContext(
                    "2d"
                );

            context.drawImage(
                cameraVideo,
                0,
                0,
                width,
                height
            );

            cameraCanvas.toBlob(
                function (blob) {

                    if (!blob) {
                        reject(
                            new Error(
                                "Unable to capture image."
                            )
                        );

                        return;
                    }

                    const file =
                        new File(
                            [blob],
                            `aadhaar-camera-${Date.now()}.jpg`,
                            {
                                type:
                                    "image/jpeg"
                            }
                        );

                    resolve(file);
                },
                "image/jpeg",
                0.95
            );
        }
    );
}

async function captureAndAttachAadhaar() {
    try {

        if (cameraCaptureButton) {
            cameraCaptureButton.disabled =
                true;

            cameraCaptureButton.textContent =
                "Capturing...";
        }

        const file =
            await captureCameraFile();

        if (!aadhaarInput) {
            throw new Error(
                "Aadhaar input not found."
            );
        }

        const transfer =
            new DataTransfer();

        transfer.items.add(file);

        aadhaarInput.files =
            transfer.files;

        if (selectedFileLabel) {
            selectedFileLabel.textContent =
                `✓ Aadhaar image captured: ${file.name}`;
        }

        stopCamera();

        showMessage(
            verificationMessage,
            "✓ Aadhaar image captured successfully. Click Verify ID & Create Account.",
            "#087f5b"
        );

    } catch (error) {

        console.error(
            "Capture error:",
            error
        );

        showMessage(
            verificationMessage,
            "✕ Unable to capture the Aadhaar image.",
            "#d00037"
        );

    } finally {

        if (cameraCaptureButton) {
            cameraCaptureButton.disabled =
                false;

            cameraCaptureButton.textContent =
                "📸 Capture & Scan";
        }
    }
}

async function loadExternalScript(
    src,
    globalName
) {
    if (window[globalName]) {
        return;
    }

    await new Promise(
        function (resolve, reject) {

            const existing =
                document.querySelector(
                    `script[src="${src}"]`
                );

            if (existing) {

                if (window[globalName]) {
                    resolve();
                    return;
                }

                existing.addEventListener(
                    "load",
                    resolve,
                    {
                        once: true
                    }
                );

                existing.addEventListener(
                    "error",
                    reject,
                    {
                        once: true
                    }
                );

                return;
            }

            const script =
                document.createElement(
                    "script"
                );

            script.src = src;

            script.onload = resolve;
            script.onerror = reject;

            document.head.appendChild(
                script
            );
        }
    );
}

async function loadOCRLibrary() {
    await loadExternalScript(
        "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
        "Tesseract"
    );
}

function parseDateText(text) {
    const match =
        String(text || "").match(
            /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/
        );

    if (!match) {
        return null;
    }

    const day =
        Number(match[1]);

    const month =
        Number(match[2]);

    const year =
        Number(match[3]);

    if (
        year < 1900 ||
        year > new Date().getFullYear() ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return null;
    }

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function findDOB(text) {

    const normalized =
        String(text || "")
            .replace(/[|]/g, "I")
            .replace(/\s+/g, " ")
            .trim();

    const labeled =
        normalized.match(
            /(?:date\s*of\s*birth|dob|d\.o\.b\.?)\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})/i
        );

    if (labeled) {

        const date =
            parseDateText(
                labeled[1]
            );

        if (date) {
            return date;
        }
    }

    const allDates =
        normalized.match(
            /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}\b/g
        ) || [];

    for (
        const dateText of allDates
    ) {

        const date =
            parseDateText(
                dateText
            );

        if (date) {
            return date;
        }
    }

    return null;
}

function calculateAge(dob) {

    const today =
        new Date();

    let age =
        today.getFullYear() -
        dob.getFullYear();

    if (
        today.getMonth() <
            dob.getMonth() ||
        (
            today.getMonth() ===
                dob.getMonth() &&
            today.getDate() <
                dob.getDate()
        )
    ) {
        age--;
    }

    return age;
}

function looksLikeAadhaar(text) {

    const normalized =
        String(text || "")
            .toLowerCase();

    const indicators = [
        "aadhaar",
        "aadhar",
        "uidai",
        "unique identification",
        "government of india",
        "my aadhaar",
        "mera aadhaar"
    ];

    const foundCount =
        indicators.filter(
            function (item) {
                return normalized.includes(
                    item
                );
            }
        ).length;

    const aadhaarNumberPattern =
        /\b\d{4}\s?\d{4}\s?\d{4}\b/
            .test(text);

    return (
        foundCount >= 2 ||
        (
            (
                normalized.includes(
                    "aadhaar"
                ) ||
                normalized.includes(
                    "aadhar"
                ) ||
                normalized.includes(
                    "uidai"
                )
            ) &&
            aadhaarNumberPattern
        )
    );
}

async function scanImageFile(file) {

    await loadOCRLibrary();

    if (!window.Tesseract) {
        throw new Error(
            "OCR library could not be loaded."
        );
    }

    const result =
        await window.Tesseract.recognize(
            file,
            "eng",
            {
                logger:
                    function (info) {

                        if (
                            info.status ===
                                "recognizing text" &&
                            typeof info.progress ===
                                "number"
                        ) {

                            const percent =
                                Math.round(
                                    info.progress *
                                        100
                                );

                            showMessage(
                                verificationMessage,
                                `🔍 Scanning Aadhaar... ${percent}%`,
                                "#8a5a00"
                            );
                        }
                    }
            }
        );

    return (
        result.data.text || ""
    );
}

async function scanSelectedAadhaar() {

    if (
        !aadhaarInput ||
        !aadhaarInput.files ||
        aadhaarInput.files.length === 0
    ) {
        throw new Error(
            "Please scan or select an Aadhaar document."
        );
    }

    const file =
        aadhaarInput.files[0];

    if (
        file.type ===
        "application/pdf"
    ) {

        throw new Error(
            "For the camera scanner, please scan an Aadhaar image. PDF OCR can be added separately."
        );
    }

    return scanImageFile(file);
}

// =========================================================
// CAMERA EVENTS
// =========================================================

if (cameraStartButton) {
    cameraStartButton.addEventListener(
        "click",
        startCamera
    );
}

if (cameraStopButton) {
    cameraStopButton.addEventListener(
        "click",
        stopCamera
    );
}

if (cameraCaptureButton) {
    cameraCaptureButton.addEventListener(
        "click",
        captureAndAttachAadhaar
    );
}

if (chooseFileButton) {
    chooseFileButton.addEventListener(
        "click",
        function () {

            if (aadhaarInput) {
                aadhaarInput.click();
            }
        }
    );
}

if (aadhaarInput) {

    aadhaarInput.addEventListener(
        "change",
        function () {

            if (
                !aadhaarInput.files ||
                !aadhaarInput.files.length
            ) {
                return;
            }

            const file =
                aadhaarInput.files[0];

            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                aadhaarInput.value =
                    "";

                showMessage(
                    verificationMessage,
                    "✕ Please select a PDF, JPG, JPEG, PNG or WEBP file.",
                    "#d00037"
                );

                return;
            }

            if (selectedFileLabel) {
                selectedFileLabel.textContent =
                    `Selected: ${file.name}`;
            }

            showMessage(
                verificationMessage,
                "✓ Aadhaar document selected.",
                "#087f5b"
            );
        }
    );
}

window.addEventListener(
    "beforeunload",
    stopCamera
);

// =========================================================
// SIGNUP
// =========================================================

const signupButton =
    document.getElementById(
        "signupButton"
    );

if (signupButton) {

    signupButton.addEventListener(
        "click",
        async function () {

            const name =
                document
                    .getElementById(
                        "signupName"
                    )
                    .value
                    .trim();

            const email =
                document
                    .getElementById(
                        "signupEmail"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "signupPassword"
                    )
                    .value;

            const phoneElement =
                document.getElementById(
                    "signupPhone"
                );

            const phone =
                phoneElement
                    ? normalizePhone(
                        phoneElement.value
                    )
                    : "";

            const documentInput =
                document.getElementById(
                    "aadhaarDocument"
                );

            const message =
                document.getElementById(
                    "signupMessage"
                );

            const ageMessage =
                document.getElementById(
                    "ageVerificationMessage"
                );

            if (
                !name ||
                !email ||
                !password ||
                !phone
            ) {

                showMessage(
                    message,
                    "Please fill in your name, mobile number, email and password.",
                    "#d00037"
                );

                return;
            }

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(email)
            ) {

                showMessage(
                    message,
                    "Please enter a valid email address.",
                    "#d00037"
                );

                return;
            }

            if (
                !isValidPhone(phone)
            ) {

                showMessage(
                    message,
                    "Please enter a valid 10-digit mobile number.",
                    "#d00037"
                );

                return;
            }

            if (password.length < 6) {

                showMessage(
                    message,
                    "Password must contain at least 6 characters.",
                    "#d00037"
                );

                return;
            }

            if (
                !documentInput ||
                !documentInput.files ||
                !documentInput.files.length
            ) {

                showMessage(
                    ageMessage,
                    "Please scan or select your Aadhaar document.",
                    "#d00037"
                );

                return;
            }

            const file =
                documentInput.files[0];

            if (
                file.size >
                5 * 1024 * 1024
            ) {

                showMessage(
                    ageMessage,
                    "Aadhaar document must be smaller than 5 MB.",
                    "#d00037"
                );

                return;
            }

            signupButton.disabled =
                true;

            signupButton.textContent =
                "Scanning Aadhaar...";

            try {

                const ocrText =
                    await scanSelectedAadhaar();

                if (
                    !looksLikeAadhaar(
                        ocrText
                    )
                ) {

                    showMessage(
                        ageMessage,
                        "✕ This document does not appear to be an Aadhaar document.",
                        "#d00037"
                    );

                    return;
                }

                const dob =
                    findDOB(
                        ocrText
                    );

                if (!dob) {

                    showMessage(
                        ageMessage,
                        "✕ Date of Birth could not be detected. Please use a clear Aadhaar image.",
                        "#d00037"
                    );

                    return;
                }

                const age =
                    calculateAge(dob);

                if (age < 18) {

                    showMessage(
                        ageMessage,
                        `✕ Age verification failed. Detected age: ${age}. You must be 18 or older.`,
                        "#d00037"
                    );

                    return;
                }

                showMessage(
                    ageMessage,
                    `✓ Aadhaar demo scan completed. Detected age: ${age}. Eligibility passed.`,
                    "#087f5b"
                );

                const response =
                    await fetch(
                        `${API_URL}/signup`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    name:
                                        name,

                                    email:
                                        email,

                                    password:
                                        password,

                                    phone:
                                        phone,

                                    documentUploaded:
                                        true,

                                    ageVerified:
                                        true,

                                    verificationStatus:
                                        "ID Verified"
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    showMessage(
                        message,
                        data.message ||
                            "Unable to create account.",
                        "#d00037"
                    );

                    return;
                }

                showMessage(
                    message,
                    "Account created successfully! Please login.",
                    "#087f5b"
                );

                document.getElementById(
                    "signupName"
                ).value = "";

                document.getElementById(
                    "signupEmail"
                ).value = "";

                document.getElementById(
                    "signupPassword"
                ).value = "";

                if (phoneElement) {
                    phoneElement.value =
                        "";
                }

                documentInput.value =
                    "";

                if (selectedFileLabel) {
                    selectedFileLabel.textContent =
                        "";
                }

            } catch (error) {

                console.error(
                    "Signup / Aadhaar scan error:",
                    error
                );

                showMessage(
                    ageMessage,
                    error.message ||
                        "Unable to scan the Aadhaar document.",
                    "#d00037"
                );

            } finally {

                signupButton.disabled =
                    false;

                signupButton.textContent =
                    "Verify ID & Create Account";
            }
        }
    );
}

// =========================================================
// LOGIN
// =========================================================

const loginButton =
    document.getElementById(
        "loginButton"
    );

if (loginButton) {

    loginButton.addEventListener(
        "click",
        async function () {

            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;

            const message =
                document.getElementById(
                    "loginMessage"
                );

            if (
                !email ||
                !password
            ) {

                showMessage(
                    message,
                    "Please enter your email and password.",
                    "#d00037"
                );

                return;
            }

            loginButton.disabled =
                true;

            loginButton.textContent =
                "Logging in...";

            try {

                const response =
                    await fetch(
                        `${API_URL}/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email:
                                        email,
                                    password:
                                        password
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    showMessage(
                        message,
                        data.message ||
                            "Invalid email or password.",
                        "#d00037"
                    );

                    return;
                }

                saveLoggedInUser(
                    data.user
                );

                showMessage(
                    message,
                    data.message ||
                        "Login successful!",
                    "#087f5b"
                );

                setTimeout(
                    function () {
                        window.location.href =
                            "index.html";
                    },
                    1000
                );

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                showMessage(
                    message,
                    "Unable to connect to BloodLink backend.",
                    "#d00037"
                );

            } finally {

                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "Login";
            }
        }
    );
}

// =========================================================
// DONOR PAGE LOGIN PROTECTION
// =========================================================

if (
    window.location.pathname.endsWith(
        "donor.html"
    )
) {

    const user =
        getLoggedInUser();

    if (!user) {

        alert(
            "Please login first to register as a blood donor."
        );

        window.location.href =
            "login.html";
    }
}

// =========================================================
// DONOR PAGE INITIALIZATION
// =========================================================

function initializeDonorPage() {

    const user =
        getLoggedInUser();

    const donorNameInput =
        document.getElementById(
            "donorName"
        );

    const donorPhoneInput =
        document.getElementById(
            "donorPhone"
        );

    const donorAgeMessage =
        document.getElementById(
            "donorAgeMessage"
        );

    const donorIdCard =
        document.getElementById(
            "donorIdCard"
        );

    const donorIdValue =
        document.getElementById(
            "donorIdValue"
        );

    if (!user) {
        return;
    }

    // -----------------------------------------
    // NAME
    // -----------------------------------------

    if (donorNameInput) {

        donorNameInput.value =
            user.name || "";

        donorNameInput.readOnly =
            true;
    }

    // -----------------------------------------
    // REGISTERED MOBILE
    // -----------------------------------------

    const registeredPhone =
        normalizePhone(
            user.phone
        );

    if (donorPhoneInput) {

        donorPhoneInput.value =
            registeredPhone;

        donorPhoneInput.readOnly =
            true;

        donorPhoneInput.disabled =
            false;
    }

    // -----------------------------------------
    // VERIFICATION STATUS
    // -----------------------------------------

    if (donorAgeMessage) {

        if (
            user.ageVerified === true &&
            user.documentUploaded === true
        ) {

            donorAgeMessage.textContent =
                "✓ Age/ID verification completed. You can register as a donor.";

            donorAgeMessage.style.color =
                "#087f5b";

        } else {

            donorAgeMessage.textContent =
                "✕ Age/ID verification is required.";

            donorAgeMessage.style.color =
                "#d00037";
        }
    }

    // -----------------------------------------
    // PREVIOUS DONOR ID
    // -----------------------------------------

    const storedDonorId =
        localStorage.getItem(
            DONOR_ID_KEY
        );

    if (
        storedDonorId &&
        donorIdCard &&
        donorIdValue
    ) {

        donorIdValue.textContent =
            storedDonorId;

        donorIdCard.style.display =
            "block";
    }
}

if (
    window.location.pathname.endsWith(
        "donor.html"
    )
) {

    initializeDonorPage();

    // Extra initialization in case the page
    // is loaded before all elements are ready.
    setTimeout(
        initializeDonorPage,
        100
    );
}

// =========================================================
// DONOR REGISTRATION
// =========================================================

const donorRegisterButton =
    document.getElementById(
        "donorRegisterButton"
    );

if (donorRegisterButton) {

    donorRegisterButton.addEventListener(
        "click",
        async function () {

            const currentUser =
                getLoggedInUser();

            const message =
                document.getElementById(
                    "donorMessage"
                );

            const donorNameInput =
                document.getElementById(
                    "donorName"
                );

            const donorPhoneInput =
                document.getElementById(
                    "donorPhone"
                );

            if (!currentUser) {

                alert(
                    "Please login first."
                );

                window.location.href =
                    "login.html";

                return;
            }

            if (
                currentUser.ageVerified !==
                    true ||
                currentUser.documentUploaded !==
                    true
            ) {

                showMessage(
                    message,
                    "You must complete age/ID verification before donor registration.",
                    "#d00037"
                );

                return;
            }

            const name =
                donorNameInput
                    ? donorNameInput.value.trim()
                    : "";

            const blood =
                document.getElementById(
                    "donorBlood"
                ).value;

            const city =
                document
                    .getElementById(
                        "donorCity"
                    )
                    .value
                    .trim();

            // ALWAYS use the mobile number
            // stored in the logged-in account.
            const phone =
                normalizePhone(
                    currentUser.phone
                );

            if (
                donorPhoneInput &&
                donorPhoneInput.value !==
                    phone
            ) {
                donorPhoneInput.value =
                    phone;
            }

            if (
                !name ||
                !blood ||
                !city ||
                !phone
            ) {

                showMessage(
                    message,
                    "Your name, blood group, city and registered mobile number are required.",
                    "#d00037"
                );

                return;
            }

            if (
                !isValidPhone(phone)
            ) {

                showMessage(
                    message,
                    "Your registered mobile number is invalid.",
                    "#d00037"
                );

                return;
            }

            donorRegisterButton.disabled =
                true;

            donorRegisterButton.textContent =
                "Registering...";

            try {

                const response =
                    await fetch(
                        `${API_URL}/donors`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    userId:
                                        currentUser.id,

                                    name:
                                        name,

                                    blood:
                                        blood,

                                    city:
                                        city,

                                    phone:
                                        phone
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    showMessage(
                        message,
                        data.message ||
                            "Unable to register donor.",
                        "#d00037"
                    );

                    return;
                }

                const donor =
                    data.donor || {};

                const donorId =
                    donor.donorId ||
                    "Not available";

                // Save donor ID locally.
                localStorage.setItem(
                    DONOR_ID_KEY,
                    donorId
                );

                const donorIdCard =
                    document.getElementById(
                        "donorIdCard"
                    );

                const donorIdValue =
                    document.getElementById(
                        "donorIdValue"
                    );

                if (donorIdValue) {
                    donorIdValue.textContent =
                        donorId;
                }

                if (donorIdCard) {
                    donorIdCard.style.display =
                        "block";
                }

                showMessage(
                    message,
                    `✅ Donor registration successful! Your unique Donor ID is ${donorId}.`,
                    "#087f5b"
                );

                if (donorPhoneInput) {
                    donorPhoneInput.value =
                        phone;

                    donorPhoneInput.readOnly =
                        true;
                }

                document.getElementById(
                    "donorBlood"
                ).value = "";

                document.getElementById(
                    "donorCity"
                ).value = "";

            } catch (error) {

                console.error(
                    "Donor registration error:",
                    error
                );

                showMessage(
                    message,
                    "Unable to connect to BloodLink backend.",
                    "#d00037"
                );

            } finally {

                donorRegisterButton.disabled =
                    false;

                donorRegisterButton.textContent =
                    "🩸 Register as Blood Donor";
            }
        }
    );
}

// =========================================================
// FIND DONOR
// =========================================================

const searchDonorButton =
    document.getElementById(
        "searchDonorButton"
    );

if (searchDonorButton) {

    searchDonorButton.addEventListener(
        "click",
        async function () {

            const blood =
                document.getElementById(
                    "searchBlood"
                ).value;

            const city =
                document
                    .getElementById(
                        "searchCity"
                    )
                    .value
                    .trim();

            const results =
                document.getElementById(
                    "searchResults"
                );

            const message =
                document.getElementById(
                    "searchMessage"
                );

            results.innerHTML =
                "";

            searchDonorButton.disabled =
                true;

            searchDonorButton.textContent =
                "Searching...";

            try {

                const params =
                    new URLSearchParams();

                if (blood) {
                    params.append(
                        "blood",
                        blood
                    );
                }

                if (city) {
                    params.append(
                        "city",
                        city
                    );
                }

                const response =
                    await fetch(
                        `${API_URL}/donors/search?${params.toString()}`
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    showMessage(
                        message,
                        data.message ||
                            "Unable to search donors.",
                        "#d00037"
                    );

                    return;
                }

                const donors =
                    data.donors || [];

                if (donors.length === 0) {

                    showMessage(
                        message,
                        "No matching donors found.",
                        "#d00037"
                    );

                    return;
                }

                showMessage(
                    message,
                    `${donors.length} donor(s) found.`,
                    "#087f5b"
                );

                donors.forEach(
                    function (donor) {

                        const card =
                            document.createElement(
                                "div"
                            );

                        card.className =
                            "donor-card";

                        card.innerHTML = `
                            <h3>
                                🩸 ${donor.name}
                            </h3>

                            <p>
                                <strong>
                                    Blood Group:
                                </strong>
                                ${donor.blood}
                            </p>

                            <p>
                                <strong>
                                    Location:
                                </strong>
                                ${donor.city}
                            </p>

                            <p>
                                <strong>
                                    Mobile:
                                </strong>
                                ${donor.phone}
                            </p>

                            <a
                                class="call-button"
                                href="tel:${donor.phone}"
                            >
                                📞 Call Donor
                            </a>

                            <button
                                class="sms-button"
                                onclick="sendBloodRequestSMS('${donor.id}')"
                            >
                                💬 Request Blood by SMS
                            </button>
                        `;

                        results.appendChild(
                            card
                        );
                    }
                );

            } catch (error) {

                console.error(
                    "Search error:",
                    error
                );

                showMessage(
                    message,
                    "Unable to connect to BloodLink backend.",
                    "#d00037"
                );

            } finally {

                searchDonorButton.disabled =
                    false;

                searchDonorButton.textContent =
                    "Search Donors";
            }
        }
    );
}

// =========================================================
// SMS REQUEST
// =========================================================

async function sendBloodRequestSMS(
    donorId
) {

    try {

        const donorResponse =
            await fetch(
                `${API_URL}/donors`
            );

        const donorData =
            await donorResponse.json();

        if (!donorResponse.ok) {

            alert(
                "Unable to get donor information."
            );

            return;
        }

        const donors =
            donorData.donors || [];

        const donor =
            donors.find(
                function (item) {

                    return (
                        String(
                            item.id
                        ) ===
                        String(
                            donorId
                        )
                    );
                }
            );

        if (!donor) {

            alert(
                "Donor information not found."
            );

            return;
        }

        const requestResponse =
            await fetch(
                `${API_URL}/requests`
            );

        const requestData =
            await requestResponse.json();

        if (!requestResponse.ok) {

            alert(
                "Unable to get blood request."
            );

            return;
        }

        const requests =
            requestData.requests || [];

        if (requests.length === 0) {

            alert(
                "Please create a blood request first."
            );

            return;
        }

        const request =
            requests[
                requests.length - 1
            ];

        const blood =
            request.blood ||
            request.bloodGroup ||
            "";

        const text =
`BloodLink Blood Request

Patient: ${request.requesterName}

Blood Group: ${blood}

Location: ${request.city}

Contact: ${request.phone}

Message: ${
    request.message ||
    "Urgent blood requirement"
}

Please contact the patient if you are available to donate.

Thank you.`;

        window.location.href =
            `sms:${donor.phone}?body=${encodeURIComponent(
                text
            )}`;

    } catch (error) {

        console.error(
            "SMS request error:",
            error
        );

        alert(
            "Unable to connect to BloodLink backend."
        );
    }
}

// =========================================================
// BLOOD REQUEST
// =========================================================

const requestBloodButton =
    document.getElementById(
        "requestBloodButton"
    );

if (requestBloodButton) {

    requestBloodButton.addEventListener(
        "click",
        async function () {

            const requesterName =
                document
                    .getElementById(
                        "requesterName"
                    )
                    .value
                    .trim();

            const blood =
                document.getElementById(
                    "requestBlood"
                ).value;

            const city =
                document
                    .getElementById(
                        "requestCity"
                    )
                    .value
                    .trim();

            const phone =
                normalizePhone(
                    document
                        .getElementById(
                            "requestPhone"
                        )
                        .value
                );

            const requestMessage =
                document
                    .getElementById(
                        "requestMessage"
                    )
                    .value
                    .trim();

            const status =
                document.getElementById(
                    "requestMessageStatus"
                );

            if (
                !requesterName ||
                !blood ||
                !city ||
                !phone
            ) {

                showMessage(
                    status,
                    "Please fill in all required fields.",
                    "#d00037"
                );

                return;
            }

            if (
                !isValidPhone(phone)
            ) {

                showMessage(
                    status,
                    "Please enter a valid 10-digit mobile number.",
                    "#d00037"
                );

                return;
            }

            requestBloodButton.disabled =
                true;

            requestBloodButton.textContent =
                "Submitting...";

            try {

                const response =
                    await fetch(
                        `${API_URL}/requests`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    requesterName:
                                        requesterName,

                                    blood:
                                        blood,

                                    bloodGroup:
                                        blood,

                                    city:
                                        city,

                                    phone:
                                        phone,

                                    message:
                                        requestMessage
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    showMessage(
                        status,
                        data.message ||
                            "Unable to submit blood request.",
                        "#d00037"
                    );

                    return;
                }

                showMessage(
                    status,
                    "Blood request submitted successfully! ❤️",
                    "#087f5b"
                );

                document.getElementById(
                    "requesterName"
                ).value = "";

                document.getElementById(
                    "requestBlood"
                ).value = "";

                document.getElementById(
                    "requestCity"
                ).value = "";

                document.getElementById(
                    "requestPhone"
                ).value = "";

                document.getElementById(
                    "requestMessage"
                ).value = "";

            } catch (error) {

                console.error(
                    "Blood request error:",
                    error
                );

                showMessage(
                    status,
                    "Unable to connect to BloodLink backend.",
                    "#d00037"
                );

            } finally {

                requestBloodButton.disabled =
                    false;

                requestBloodButton.textContent =
                    "Submit Blood Request";
            }
        }
    );
}

// =========================================================
// BLOOD COMPATIBILITY
// =========================================================

const compatibilityButton =
    document.getElementById(
        "checkCompatibilityButton"
    );

if (compatibilityButton) {

    compatibilityButton.addEventListener(
        "click",
        function () {

            const donorBlood =
                document.getElementById(
                    "donorBloodGroup"
                ).value;

            const receiverBlood =
                document.getElementById(
                    "receiverBloodGroup"
                ).value;

            const result =
                document.getElementById(
                    "compatibilityResult"
                );

            if (
                !donorBlood ||
                !receiverBlood
            ) {

                showMessage(
                    result,
                    "Please select both blood groups.",
                    "#d00037"
                );

                return;
            }

            const compatibility = {

                "O-": [
                    "O-",
                    "O+",
                    "A-",
                    "A+",
                    "B-",
                    "B+",
                    "AB-",
                    "AB+"
                ],

                "O+": [
                    "O+",
                    "A+",
                    "B+",
                    "AB+"
                ],

                "A-": [
                    "A-",
                    "A+",
                    "AB-",
                    "AB+"
                ],

                "A+": [
                    "A+",
                    "AB+"
                ],

                "B-": [
                    "B-",
                    "B+",
                    "AB-",
                    "AB+"
                ],

                "B+": [
                    "B+",
                    "AB+"
                ],

                "AB-": [
                    "AB-",
                    "AB+"
                ],

                "AB+": [
                    "AB+"
                ]
            };

            const compatible =
                compatibility[
                    donorBlood
                ] &&
                compatibility[
                    donorBlood
                ].includes(
                    receiverBlood
                );

            if (compatible) {

                showMessage(
                    result,
                    `✓ ${donorBlood} donor can donate to ${receiverBlood} receiver.`,
                    "#087f5b"
                );

            } else {

                showMessage(
                    result,
                    `✕ ${donorBlood} donor cannot donate to ${receiverBlood} receiver.`,
                    "#d00037"
                );
            }
        }
    );
}

// =========================================================
// CONSOLE
// =========================================================

console.log(
    "BloodLink frontend connected to LOCAL backend."
);

console.log(
    "API:",
    API_URL
);

console.log(
    "BloodLink Aadhaar camera scanner loaded."
);

console.log(
    "BloodLink donor registration loaded."
);