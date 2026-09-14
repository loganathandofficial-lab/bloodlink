// =========================================================
// BLOODLINK FRONTEND
// =========================================================

const API_URL =
    "https://bloodlink-x2h7.onrender.com/api";

const USER_STORAGE_KEY =
    "bloodlink_logged_in_user";


// =========================================================
// COMMON HELPERS
// =========================================================

function getLoggedInUser() {

    try {

        const storedUser =
            localStorage.getItem(
                USER_STORAGE_KEY
            );

        if (!storedUser) {
            return null;
        }

        return JSON.parse(
            storedUser
        );

    } catch (error) {

        console.error(
            "User storage error:",
            error
        );

        return null;
    }
}


function showMessage(
    elementId,
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.style.padding =
        "12px 14px";

    element.style.marginTop =
        "15px";

    element.style.borderRadius =
        "10px";

    element.style.fontSize =
        "14px";

    element.style.lineHeight =
        "1.5";

    if (type === "success") {

        element.style.background =
            "#ecfdf3";

        element.style.color =
            "#157347";

        element.style.border =
            "1px solid #b7ebca";

    } else if (type === "error") {

        element.style.background =
            "#fff1f2";

        element.style.color =
            "#b4233d";

        element.style.border =
            "1px solid #f1c1c8";

    } else {

        element.style.background =
            "#f7f7f7";

        element.style.color =
            "#555";

        element.style.border =
            "1px solid #e3e3e3";
    }
}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


async function apiRequest(
    endpoint,
    options = {}
) {

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            options
        );

    let data = {};

    try {

        data =
            await response.json();

    } catch (error) {

        data = {};
    }

    if (!response.ok) {

        throw new Error(
            data.message ||
            "Request failed."
        );
    }

    return data;
}


// =========================================================
// DONOR PAGE
// =========================================================

function setupDonorPage() {

    const registerButton =
        document.getElementById(
            "donorRegisterButton"
        );

    if (!registerButton) {
        return;
    }

    const user =
        getLoggedInUser();

    const donorName =
        document.getElementById(
            "donorName"
        );

    const donorPhone =
        document.getElementById(
            "donorPhone"
        );

    const donorMessage =
        document.getElementById(
            "donorMessage"
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

        if (donorName) {
            donorName.value = "";
        }

        if (donorPhone) {
            donorPhone.value = "";
        }

        showMessage(
            "donorMessage",
            "Please login to register as a blood donor.",
            "error"
        );

        registerButton.disabled =
            true;

        return;
    }


    if (donorName) {

        donorName.value =
            user.name || "";
    }


    if (donorPhone) {

        donorPhone.value =
            user.phone || "";
    }


    registerButton.addEventListener(
        "click",
        async function () {

            const currentUser =
                getLoggedInUser();

            if (!currentUser) {

                showMessage(
                    "donorMessage",
                    "Please login before registering as a donor.",
                    "error"
                );

                return;
            }


            const bloodElement =
                document.getElementById(
                    "donorBlood"
                );

            const cityElement =
                document.getElementById(
                    "donorCity"
                );


            const blood =
                bloodElement
                    ? bloodElement.value.trim()
                    : "";

            const city =
                cityElement
                    ? cityElement.value.trim()
                    : "";


            if (!blood) {

                showMessage(
                    "donorMessage",
                    "Please select your blood group.",
                    "error"
                );

                return;
            }


            if (!city) {

                showMessage(
                    "donorMessage",
                    "Please enter your city or district.",
                    "error"
                );

                return;
            }


            if (
                !currentUser.id
            ) {

                showMessage(
                    "donorMessage",
                    "Your account information is incomplete. Please login again.",
                    "error"
                );

                return;
            }


            registerButton.disabled =
                true;

            registerButton.textContent =
                "Registering...";


            showMessage(
                "donorMessage",
                "Registering your donor profile...",
                "info"
            );


            try {

                const data =
                    await apiRequest(
                        "/donors",
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    userId:
                                        currentUser.id,

                                    name:
                                        currentUser.name ||
                                        donorName.value.trim(),

                                    blood:
                                        blood,

                                    city:
                                        city,

                                    phone:
                                        currentUser.phone || ""
                                })
                        }
                    );


                const donor =
                    data.donor || {};


                if (
                    donorIdCard &&
                    donorIdValue
                ) {

                    donorIdValue.textContent =
                        donor.donorId ||
                        "";

                    donorIdCard.style.display =
                        "block";
                }


                showMessage(
                    "donorMessage",
                    data.message ||
                        "Donor registered successfully!",
                    "success"
                );


                registerButton.textContent =
                    "Donor Registered";


                registerButton.disabled =
                    true;


            } catch (error) {

                showMessage(
                    "donorMessage",
                    error.message ||
                        "Unable to register donor.",
                    "error"
                );

                registerButton.disabled =
                    false;

                registerButton.textContent =
                    "🩸 Register as Blood Donor";
            }
        }
    );
}


// =========================================================
// FIND DONOR PAGE
// =========================================================

function setupSearchPage() {

    const searchButton =
        document.getElementById(
            "searchDonorButton"
        );

    if (!searchButton) {
        return;
    }


    const bloodElement =
        document.getElementById(
            "searchBlood"
        );

    const cityElement =
        document.getElementById(
            "searchCity"
        );

    const resultsElement =
        document.getElementById(
            "searchResults"
        );


    async function searchDonors() {

        const blood =
            bloodElement
                ? bloodElement.value.trim()
                : "";

        const city =
            cityElement
                ? cityElement.value.trim()
                : "";


        if (!blood) {

            showMessage(
                "searchMessage",
                "Please select a blood group.",
                "error"
            );

            return;
        }


        if (!city) {

            showMessage(
                "searchMessage",
                "Please enter a city or district.",
                "error"
            );

            return;
        }


        searchButton.disabled =
            true;

        searchButton.textContent =
            "Searching...";


        showMessage(
            "searchMessage",
            "Searching registered donors...",
            "info"
        );


        try {

            const query =
                `?blood=${encodeURIComponent(
                    blood
                )}&city=${encodeURIComponent(
                    city
                )}`;


            const data =
                await apiRequest(
                    `/donors/search${query}`
                );


            const donors =
                Array.isArray(
                    data.donors
                )
                    ? data.donors
                    : [];


            if (!resultsElement) {
                return;
            }


            if (!donors.length) {

                resultsElement.innerHTML = `
                    <div class="search-empty">
                        <div class="search-empty-icon">
                            🩸
                        </div>

                        <strong>
                            No matching donors found
                        </strong>

                        <p>
                            No registered donor was found
                            for ${escapeHTML(blood)}
                            in ${escapeHTML(city)}.
                        </p>
                    </div>
                `;

                showMessage(
                    "searchMessage",
                    "No matching donors found.",
                    "info"
                );

                return;
            }


            resultsElement.innerHTML =
                donors
                    .map(
                        function (donor) {

                            const phone =
                                String(
                                    donor.phone ||
                                    ""
                                ).trim();


                            const safePhone =
                                phone
                                    .replace(
                                        /[^0-9+]/g,
                                        ""
                                    );


                            const callButton =
                                safePhone
                                    ? `
                                        <a
                                            href="tel:${safePhone}"
                                            class="primary-button"
                                            style="
                                                display:inline-block;
                                                text-decoration:none;
                                                padding:10px 14px;
                                                margin-top:10px;
                                            "
                                        >
                                            📞 Call
                                        </a>
                                    `
                                    : "";


                            const smsButton =
                                safePhone
                                    ? `
                                        <a
                                            href="sms:${safePhone}"
                                            class="primary-button"
                                            style="
                                                display:inline-block;
                                                text-decoration:none;
                                                padding:10px 14px;
                                                margin-top:10px;
                                                margin-left:6px;
                                            "
                                        >
                                            💬 SMS
                                        </a>
                                    `
                                    : "";


                            return `
                                <div
                                    class="donor-result-card"
                                    style="
                                        background:#ffffff;
                                        border:1px solid #f0dfe3;
                                        border-radius:18px;
                                        padding:22px;
                                        margin-bottom:16px;
                                        box-shadow:0 10px 28px rgba(70,10,25,0.08);
                                    "
                                >

                                    <div
                                        style="
                                            display:flex;
                                            justify-content:space-between;
                                            gap:15px;
                                            align-items:flex-start;
                                            flex-wrap:wrap;
                                        "
                                    >

                                        <div>

                                            <div
                                                style="
                                                    font-size:12px;
                                                    font-weight:800;
                                                    color:#a91432;
                                                    letter-spacing:1.3px;
                                                    text-transform:uppercase;
                                                    margin-bottom:5px;
                                                "
                                            >
                                                BloodLink Donor
                                            </div>

                                            <h3
                                                style="
                                                    margin:0 0 7px;
                                                    color:#65091d;
                                                    font-size:22px;
                                                "
                                            >
                                                ${escapeHTML(
                                                    donor.name ||
                                                    "Donor"
                                                )}
                                            </h3>

                                            <div
                                                style="
                                                    color:#666;
                                                    font-size:14px;
                                                    line-height:1.8;
                                                "
                                            >

                                                <div>
                                                    <strong>
                                                        Donor ID:
                                                    </strong>
                                                    ${escapeHTML(
                                                        donor.donorId ||
                                                        "-"
                                                    )}
                                                </div>

                                                <div>
                                                    <strong>
                                                        Blood Group:
                                                    </strong>
                                                    ${escapeHTML(
                                                        donor.blood ||
                                                        donor.bloodGroup ||
                                                        "-"
                                                    )}
                                                </div>

                                                <div>
                                                    <strong>
                                                        Location:
                                                    </strong>
                                                    ${escapeHTML(
                                                        donor.city ||
                                                        "-"
                                                    )}
                                                </div>

                                                <div
                                                    style="
                                                        margin-top:8px;
                                                        font-size:16px;
                                                        color:#65091d;
                                                    "
                                                >
                                                    <strong>
                                                        📱 Mobile:
                                                    </strong>
                                                    ${
                                                        phone
                                                            ? escapeHTML(
                                                                phone
                                                            )
                                                            : "Not available"
                                                    }
                                                </div>

                                            </div>

                                        </div>


                                        <div
                                            style="
                                                text-align:right;
                                            "
                                        >

                                            <div
                                                style="
                                                    display:inline-flex;
                                                    width:64px;
                                                    height:64px;
                                                    border-radius:50%;
                                                    align-items:center;
                                                    justify-content:center;
                                                    background:#fff0f3;
                                                    color:#a91432;
                                                    font-size:18px;
                                                    font-weight:800;
                                                "
                                            >
                                                ${escapeHTML(
                                                    donor.blood ||
                                                    "?"
                                                )}
                                            </div>

                                        </div>

                                    </div>


                                    <div>
                                        ${callButton}
                                        ${smsButton}
                                    </div>

                                </div>
                            `;
                        }
                    )
                    .join("");


            showMessage(
                "searchMessage",
                `${donors.length} donor${donors.length === 1 ? "" : "s"} found.`,
                "success"
            );


        } catch (error) {

            if (resultsElement) {

                resultsElement.innerHTML = `
                    <div class="search-empty">

                        <div class="search-empty-icon">
                            ⚠️
                        </div>

                        <strong>
                            Search failed
                        </strong>

                        <p>
                            ${escapeHTML(
                                error.message ||
                                "Unable to search donors."
                            )}
                        </p>

                    </div>
                `;
            }


            showMessage(
                "searchMessage",
                error.message ||
                    "Unable to search donors.",
                "error"
            );

        } finally {

            searchButton.disabled =
                false;

            searchButton.textContent =
                "🔎 Find Donors";
        }
    }


    searchButton.addEventListener(
        "click",
        searchDonors
    );


    if (cityElement) {

        cityElement.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    searchDonors();
                }
            }
        );
    }

}


// =========================================================
// BLOOD REQUEST PAGE
// =========================================================

function setupRequestPage() {

    const requestButton =
        document.getElementById(
            "requestBloodButton"
        );

    if (!requestButton) {
        return;
    }


    const user =
        getLoggedInUser();


    const nameElement =
        document.getElementById(
            "requesterName"
        );

    const phoneElement =
        document.getElementById(
            "requesterPhone"
        );


    if (user) {

        if (
            nameElement &&
            !nameElement.value
        ) {
            nameElement.value =
                user.name || "";
        }

        if (
            phoneElement &&
            !phoneElement.value
        ) {
            phoneElement.value =
                user.phone || "";
        }
    }


    requestButton.addEventListener(
        "click",
        async function () {

            const requesterName =
                nameElement
                    ? nameElement.value.trim()
                    : "";

            const phone =
                phoneElement
                    ? phoneElement.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .trim()
                    : "";


            const bloodElement =
                document.getElementById(
                    "requestBlood"
                ) ||
                document.getElementById(
                    "bloodGroup"
                );

            const cityElement =
                document.getElementById(
                    "requestCity"
                );

            const messageElement =
                document.getElementById(
                    "requestMessageText"
                ) ||
                document.getElementById(
                    "message"
                );


            const blood =
                bloodElement
                    ? bloodElement.value.trim()
                    : "";

            const city =
                cityElement
                    ? cityElement.value.trim()
                    : "";

            const message =
                messageElement
                    ? messageElement.value.trim()
                    : "";


            if (!requesterName) {

                showMessage(
                    "requestMessage",
                    "Please enter your name.",
                    "error"
                );

                return;
            }


            if (!blood) {

                showMessage(
                    "requestMessage",
                    "Please select the required blood group.",
                    "error"
                );

                return;
            }


            if (!city) {

                showMessage(
                    "requestMessage",
                    "Please enter the city or district.",
                    "error"
                );

                return;
            }


            if (
                !/^[0-9]{10}$/.test(
                    phone
                )
            ) {

                showMessage(
                    "requestMessage",
                    "Please enter a valid 10-digit mobile number.",
                    "error"
                );

                return;
            }


            requestButton.disabled =
                true;

            requestButton.textContent =
                "Submitting...";


            try {

                const data =
                    await apiRequest(
                        "/requests",
                        {
                            method:
                                "POST",

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
                                        message
                                })
                        }
                    );


                showMessage(
                    "requestMessage",
                    data.message ||
                        "Blood request submitted successfully!",
                    "success"
                );


            } catch (error) {

                showMessage(
                    "requestMessage",
                    error.message ||
                        "Unable to submit blood request.",
                    "error"
                );

            } finally {

                requestButton.disabled =
                    false;

                requestButton.textContent =
                    "🩸 Request Blood";
            }
        }
    );
}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (
            window.BloodLinkAccount &&
            typeof
                window.BloodLinkAccount
                    .updateAccountUI ===
                "function"
        ) {

            window.BloodLinkAccount
                .updateAccountUI();
        }


        setupDonorPage();

        setupSearchPage();

        setupRequestPage();
    }
);