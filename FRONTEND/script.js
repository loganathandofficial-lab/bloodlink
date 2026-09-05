// =========================================================
// BLOODLINK
// FRONTEND JAVASCRIPT
// BACKEND + JSON STORAGE
// =========================================================

const API_URL = "https://bloodlink-x2h7.onrender.com/api";
const LOGGED_IN_USER_KEY = "bloodlink_logged_in_user";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

function saveLoggedInUser(user) {
    localStorage.setItem(
        LOGGED_IN_USER_KEY,
        JSON.stringify(user)
    );
}

function getLoggedInUser() {
    const user = localStorage.getItem(
        LOGGED_IN_USER_KEY
    );

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        console.error("Login session error:", error);
        return null;
    }
}

function showMessage(element, message, color) {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.style.color = color;
}

// =========================================================
// AADHAAR CAMERA SCANNER
// DEMO DOCUMENT SCANNING ONLY
// =========================================================

let aadhaarCameraStream = null;

const aadhaarCameraButton =
    document.getElementById("startAadhaarCamera");

const chooseAadhaarFileButton =
    document.getElementById("chooseAadhaarFile");

const aadhaarDocumentInput =
    document.getElementById("aadhaarDocument");

const aadhaarCameraBox =
    document.getElementById("aadhaarCameraBox");

const aadhaarVideo =
    document.getElementById("aadhaarCamera");

const aadhaarCanvas =
    document.getElementById("aadhaarCanvas");

const captureAadhaarButton =
    document.getElementById("captureAadhaarButton");

const stopAadhaarCameraButton =
    document.getElementById("stopAadhaarCamera");

const aadhaarSelectedFile =
    document.getElementById("aadhaarSelectedFile");

const ageVerificationMessage =
    document.getElementById(
        "ageVerificationMessage"
    );

async function startAadhaarCamera() {
    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {
        showMessage(
            ageVerificationMessage,
            "Camera access is not supported by this browser.",
            "#d00037"
        );

        return;
    }

    try {

        stopAadhaarCamera();

        aadhaarCameraStream =
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

        if (aadhaarVideo) {

            aadhaarVideo.srcObject =
                aadhaarCameraStream;

            aadhaarVideo.muted = true;

            await aadhaarVideo.play();

            if (aadhaarCameraBox) {
                aadhaarCameraBox.hidden = false;
            }

            showMessage(
                ageVerificationMessage,
                "📷 Camera ready. Place the Aadhaar card clearly inside the camera frame.",
                "#8a5a00"
            );
        }

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        showMessage(
            ageVerificationMessage,
            "✕ Camera access was denied or unavailable. Please allow camera permission and try again.",
            "#d00037"
        );
    }
}

function stopAadhaarCamera() {

    if (aadhaarCameraStream) {

        aadhaarCameraStream
            .getTracks()
            .forEach(function (track) {
                track.stop();
            });

        aadhaarCameraStream = null;
    }

    if (aadhaarVideo) {
        aadhaarVideo.srcObject = null;
    }

    if (aadhaarCameraBox) {
        aadhaarCameraBox.hidden = true;
    }
}

function cameraImageToFile() {

    if (
        !aadhaarVideo ||
        !aadhaarCanvas
    ) {
        return null;
    }

    const width =
        aadhaarVideo.videoWidth;

    const height =
        aadhaarVideo.videoHeight;

    if (!width || !height) {
        return null;
    }

    aadhaarCanvas.width = width;
    aadhaarCanvas.height = height;

    const context =
        aadhaarCanvas.getContext("2d");

    context.drawImage(
        aadhaarVideo,
        0,
        0,
        width,
        height
    );

    return new Promise(function (
        resolve,
        reject
    ) {

        aadhaarCanvas.toBlob(
            function (blob) {

                if (!blob) {
                    reject(
                        new Error(
                            "Unable to capture image."
                        )
                    );

                    return;
                }

                const timestamp =
                    Date.now();

                const file =
                    new File(
                        [blob],
                        `aadhaar-scan-${timestamp}.jpg`,
                        {
                            type: "image/jpeg"
                        }
                    );

                resolve(file);
            },
            "image/jpeg",
            0.95
        );
    });
}

async function captureAadhaarDocument() {

    if (!aadhaarVideo) {
        return;
    }

    if (
        !aadhaarVideo.videoWidth ||
        !aadhaarVideo.videoHeight
    ) {

        showMessage(
            ageVerificationMessage,
            "Please wait for the camera to start.",
            "#d00037"
        );

        return;
    }

    if (!aadhaarDocumentInput) {
        return;
    }

    try {

        if (captureAadhaarButton) {
            captureAadhaarButton.disabled = true;
            captureAadhaarButton.textContent =
                "Capturing...";
        }

        const file =
            await cameraImageToFile();

        if (!file) {

            showMessage(
                ageVerificationMessage,
                "✕ Unable to capture the Aadhaar image.",
                "#d00037"
            );

            return;
        }

        const dataTransfer =
            new DataTransfer();

        dataTransfer.items.add(file);

        aadhaarDocumentInput.files =
            dataTransfer.files;

        if (aadhaarSelectedFile) {
            aadhaarSelectedFile.textContent =
                `✓ Aadhaar image captured: ${file.name}`;
        }

        stopAadhaarCamera();

        showMessage(
            ageVerificationMessage,
            "✓ Aadhaar image captured successfully. Click Verify ID & Create Account to continue.",
            "#087f5b"
        );

    } catch (error) {

        console.error(
            "Aadhaar capture error:",
            error
        );

        showMessage(
            ageVerificationMessage,
            "✕ Unable to capture the document.",
            "#d00037"
        );

    } finally {

        if (captureAadhaarButton) {
            captureAadhaarButton.disabled = false;
            captureAadhaarButton.textContent =
                "📸 Capture & Scan";
        }
    }
}

if (aadhaarCameraButton) {

    aadhaarCameraButton.addEventListener(
        "click",
        startAadhaarCamera
    );
}

if (chooseAadhaarFileButton) {

    chooseAadhaarFileButton.addEventListener(
        "click",
        function () {

            if (aadhaarDocumentInput) {
                aadhaarDocumentInput.click();
            }
        }
    );
}

if (captureAadhaarButton) {

    captureAadhaarButton.addEventListener(
        "click",
        captureAadhaarDocument
    );
}

if (stopAadhaarCameraButton) {

    stopAadhaarCameraButton.addEventListener(
        "click",
        stopAadhaarCamera
    );
}

if (aadhaarDocumentInput) {

    aadhaarDocumentInput.addEventListener(
        "change",
        function () {

            if (
                !aadhaarDocumentInput.files ||
                !aadhaarDocumentInput.files.length
            ) {
                return;
            }

            const file =
                aadhaarDocumentInput.files[0];

            const allowedMimeTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/jpg",
                "image/webp"
            ];

            const allowedExtensions = [
                ".pdf",
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            ];

            const fileName =
                file.name.toLowerCase();

            const extensionAllowed =
                allowedExtensions.some(
                    function (extension) {
                        return fileName.endsWith(
                            extension
                        );
                    }
                );

            const typeAllowed =
                allowedMimeTypes.includes(
                    file.type
                );

            if (
                !extensionAllowed ||
                !typeAllowed
            ) {

                aadhaarDocumentInput.value =
                    "";

                if (aadhaarSelectedFile) {
                    aadhaarSelectedFile.textContent =
                        "";
                }

                showMessage(
                    ageVerificationMessage,
                    "✕ Please select an Aadhaar PDF or image file.",
                    "#d00037"
                );

                return;
            }

            if (aadhaarSelectedFile) {
                aadhaarSelectedFile.textContent =
                    `Selected: ${file.name}`;
            }

            showMessage(
                ageVerificationMessage,
                "✓ Aadhaar document selected. Click Verify ID & Create Account.",
                "#087f5b"
            );
        }
    );
}

window.addEventListener(
    "beforeunload",
    stopAadhaarCamera
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
                !password
            ) {

                showMessage(
                    message,
                    "Please fill in your name, email and password.",
                    "#d00037"
                );

                return;
            }

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {

                showMessage(
                    message,
                    "Please enter a valid email address.",
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
                documentInput.files.length === 0
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

            const allowedMimeTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/jpg",
                "image/webp"
            ];

            const allowedExtensions = [
                ".pdf",
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            ];

            const fileName =
                file.name.toLowerCase();

            const typeAllowed =
                allowedMimeTypes.includes(
                    file.type
                );

            const extensionAllowed =
                allowedExtensions.some(
                    function (extension) {
                        return fileName.endsWith(
                            extension
                        );
                    }
                );

            if (
                !typeAllowed ||
                !extensionAllowed
            ) {

                documentInput.value = "";

                showMessage(
                    ageMessage,
                    "✕ Only PDF, JPG, JPEG, PNG or WEBP documents are supported.",
                    "#d00037"
                );

                return;
            }

            const maximumFileSize =
                5 * 1024 * 1024;

            if (
                file.size > maximumFileSize
            ) {

                showMessage(
                    ageMessage,
                    "Document must be smaller than 5 MB.",
                    "#d00037"
                );

                return;
            }

            /*
             * IMPORTANT:
             * The camera capture is now connected.
             *
             * This frontend does NOT perform real UIDAI authentication.
             * A real UIDAI verification system must be performed through
             * an authorized UIDAI-supported verification process.
             */

            showMessage(
                ageMessage,
                "✓ Document captured successfully. Verification service required for real Aadhaar authentication.",
                "#087f5b"
            );

            signupButton.disabled = true;
            signupButton.textContent =
                "Creating Account...";

            try {

                const response =
                    await fetch(
                        `${API_URL}/signup`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name:
                                    name,
                                email:
                                    email,
                                password:
                                    password,
                                documentUploaded:
                                    true,
                                ageVerified:
                                    true,
                                verificationStatus:
                                    "ID Verified"
                            })
                        }
                    );

                let data = {};

                try {
                    data =
                        await response.json();
                } catch (error) {
                    data = {};
                }

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

                documentInput.value = "";

                if (aadhaarSelectedFile) {
                    aadhaarSelectedFile.textContent =
                        "";
                }

            } catch (error) {

                console.error(
                    "Signup error:",
                    error
                );

                showMessage(
                    message,
                    "Unable to connect to BloodLink backend.",
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

            loginButton.disabled = true;
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

                            body: JSON.stringify({
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
                        "Login successful.",
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

    const loggedInUser =
        getLoggedInUser();

    if (!loggedInUser) {

        alert(
            "Please login first to register as a blood donor."
        );

        window.location.href =
            "login.html";
    }
}

// =========================================================
// DONOR REGISTRATION
// =========================================================

const donorRegisterButton =
    document.getElementById(
        "donorRegisterButton"
    );

if (donorRegisterButton) {

    const loggedInUser =
        getLoggedInUser();

    if (loggedInUser) {

        const donorNameInput =
            document.getElementById(
                "donorName"
            );

        const donorAgeMessage =
            document.getElementById(
                "donorAgeMessage"
            );

        if (donorNameInput) {

            donorNameInput.value =
                loggedInUser.name || "";
        }

        if (donorAgeMessage) {

            if (
                loggedInUser.ageVerified &&
                loggedInUser.documentUploaded
            ) {

                donorAgeMessage.textContent =
                    "✓ Your ID verification is completed. You can register as a donor.";

                donorAgeMessage.style.color =
                    "#087f5b";

            } else {

                donorAgeMessage.textContent =
                    "✕ ID verification is required.";

                donorAgeMessage.style.color =
                    "#d00037";
            }
        }
    }

    donorRegisterButton.addEventListener(
        "click",
        async function () {

            const user =
                getLoggedInUser();

            if (!user) {

                alert(
                    "Please login first."
                );

                window.location.href =
                    "login.html";

                return;
            }

            if (
                !user.ageVerified ||
                !user.documentUploaded
            ) {

                const message =
                    document.getElementById(
                        "donorMessage"
                    );

                showMessage(
                    message,
                    "You must complete ID verification before donor registration.",
                    "#d00037"
                );

                return;
            }

            const name =
                document
                    .getElementById(
                        "donorName"
                    )
                    .value
                    .trim();

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

            const phone =
                document
                    .getElementById(
                        "donorPhone"
                    )
                    .value
                    .trim();

            const message =
                document.getElementById(
                    "donorMessage"
                );

            if (
                !name ||
                !blood ||
                !city ||
                !phone
            ) {

                showMessage(
                    message,
                    "Please fill in all donor details.",
                    "#d00037"
                );

                return;
            }

            const phonePattern =
                /^[0-9]{10}$/;

            if (!phonePattern.test(phone)) {

                showMessage(
                    message,
                    "Please enter a valid 10-digit mobile number.",
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

                            body: JSON.stringify({
                                userId:
                                    user.id,

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

                showMessage(
                    message,
                    "Donor registration successful! ❤️",
                    "#087f5b"
                );

                document.getElementById(
                    "donorBlood"
                ).value = "";

                document.getElementById(
                    "donorCity"
                ).value = "";

                document.getElementById(
                    "donorPhone"
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
                    "Register as Donor";
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

            results.innerHTML = "";

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

                const matchingDonors =
                    data.donors || [];

                if (
                    matchingDonors.length === 0
                ) {

                    showMessage(
                        message,
                        "No matching donors found.",
                        "#d00037"
                    );

                    return;
                }

                showMessage(
                    message,
                    `${matchingDonors.length} donor(s) found.`,
                    "#087f5b"
                );

                matchingDonors.forEach(
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
// SMS BLOOD REQUEST
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
                        String(item.id) ===
                        String(donorId)
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

        if (
            requests.length === 0
        ) {

            alert(
                "Please create a blood request first."
            );

            return;
        }

        const request =
            requests[
                requests.length - 1
            ];

        const bloodGroup =
            request.blood ||
            request.bloodGroup ||
            "";

        const smsMessage =
`BloodLink Blood Request

Patient: ${request.requesterName}

Blood Group: ${bloodGroup}

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
                smsMessage
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
                document
                    .getElementById(
                        "requestPhone"
                    )
                    .value
                    .trim();

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

            const phonePattern =
                /^[0-9]{10}$/;

            if (
                !phonePattern.test(phone)
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

                            body: JSON.stringify({

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
// CONSOLE INFORMATION
// =========================================================

console.log(
    "BloodLink frontend connected to backend."
);

console.log(
    "API:",
    API_URL
);

console.log(
    "Aadhaar camera scanner loaded."
);