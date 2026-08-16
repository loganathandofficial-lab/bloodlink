"use strict";

const API_URL = "https://bloodlink-x2h7.onrender.com/api";

console.log("BloodLink frontend loaded");

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("BloodLink DOM loaded");

    // MENU
    document.querySelectorAll(".menu-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const page = button.getAttribute("data-page");

            showPage(page);
        });
    });

    // HOME BUTTONS
    const goSearch = document.getElementById("goSearch");

    if (goSearch) {
        goSearch.addEventListener("click", function () {
            showPage("search");
        });
    }

    const goRegister = document.getElementById("goRegister");

    if (goRegister) {
        goRegister.addEventListener("click", function () {
            showPage("register");
        });
    }

    // SEARCH
    const searchButton = document.getElementById("searchButton");

    if (searchButton) {
        searchButton.addEventListener("click", searchDonors);
    }

    const clearButton = document.getElementById("clearButton");

    if (clearButton) {
        clearButton.addEventListener("click", clearSearch);
    }

    // REGISTER
    const registerButton =
        document.getElementById("registerButton");

    if (registerButton) {
        registerButton.addEventListener("click", registerDonor);
    }

    // COMPATIBILITY
    const compatibilityBlood =
        document.getElementById("compatibilityBlood");

    if (compatibilityBlood) {
        compatibilityBlood.addEventListener(
            "change",
            showCompatibility
        );
    }

    // ELIGIBILITY
    const eligibilityButton =
        document.getElementById("eligibilityButton");

    if (eligibilityButton) {
        eligibilityButton.addEventListener(
            "click",
            checkEligibility
        );
    }

    // LOCATION
    const locationButton =
        document.getElementById("locationButton");

    if (locationButton) {
        locationButton.addEventListener(
            "click",
            searchLocation
        );
    }

    // LOAD REAL DONOR COUNT
    loadDonorCount();
});


// =====================================================
// PAGE NAVIGATION
// =====================================================

function showPage(pageId) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(function (page) {
        page.classList.remove("active");
    });

    const selectedPage =
        document.getElementById(pageId);

    if (!selectedPage) {
        console.error("Page not found:", pageId);
        return;
    }

    selectedPage.classList.add("active");

    const buttons =
        document.querySelectorAll(".menu-btn");

    buttons.forEach(function (button) {
        button.classList.remove("active");
    });

    const activeButton =
        document.querySelector(
            '.menu-btn[data-page="' +
            pageId +
            '"]'
        );

    if (activeButton) {
        activeButton.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =====================================================
// LOAD DONOR COUNT FROM DATABASE
// =====================================================

async function loadDonorCount() {

    const element =
        document.getElementById("donorCount");

    if (!element) {
        return;
    }

    try {

        const response =
            await fetch(API_URL + "/donors");

        if (!response.ok) {
            throw new Error("Failed to load donors");
        }

        const donors =
            await response.json();

        element.textContent =
            donors.length;

    } catch (error) {

        console.error(
            "Donor count error:",
            error
        );

        element.textContent = "0";
    }
}


// =====================================================
// REGISTER DONOR
// =====================================================

async function registerDonor() {

    const name =
        document.getElementById("donorName")
            .value
            .trim();

    const age =
        Number(
            document.getElementById("donorAge")
                .value
        );

    const blood =
        document.getElementById("donorBlood")
            .value;

    const city =
        document.getElementById("donorCity")
            .value
            .trim();

    const phone =
        document.getElementById("donorPhone")
            .value
            .trim();

    const message =
        document.getElementById("registerMessage");


    // VALIDATION
    if (
        !name ||
        !age ||
        !blood ||
        !city ||
        !phone
    ) {

        message.textContent =
            "⚠️ Please fill all fields.";

        message.style.color =
            "#b91c2c";

        return;
    }


    if (age < 18 || age > 65) {

        message.textContent =
            "⚠️ Age must be between 18 and 65.";

        message.style.color =
            "#b91c2c";

        return;
    }


    // PHONE VALIDATION
    const phonePattern =
        /^[0-9+()\-\s]{7,20}$/;

    if (!phonePattern.test(phone)) {

        message.textContent =
            "⚠️ Enter a valid mobile number.";

        message.style.color =
            "#b91c2c";

        return;
    }


    message.textContent =
        "⏳ Registering donor...";

    message.style.color =
        "#555";


    try {

        const response =
            await fetch(
                API_URL + "/donors",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name: name,

                        bloodGroup: blood,

                        phone: phone,

                        city: city,

                        state: "",

                        country: "",

                        latitude: null,

                        longitude: null
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Registration failed"
            );
        }


        message.textContent =
            "✅ Donor registered successfully!";

        message.style.color =
            "#16803d";


        // CLEAR FORM
        document.getElementById(
            "donorName"
        ).value = "";

        document.getElementById(
            "donorAge"
        ).value = "";

        document.getElementById(
            "donorBlood"
        ).value = "";

        document.getElementById(
            "donorCity"
        ).value = "";

        document.getElementById(
            "donorPhone"
        ).value = "";


        // UPDATE COUNT
        loadDonorCount();


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        message.textContent =
            "❌ Unable to register donor. Check backend connection.";

        message.style.color =
            "#b91c2c";
    }
}


// =====================================================
// SEARCH DONORS
// =====================================================

async function searchDonors() {

    const blood =
        document.getElementById(
            "searchBlood"
        ).value;

    const city =
        document.getElementById(
            "searchCity"
        ).value
        .trim();


    const results =
        document.getElementById(
            "donorResults"
        );

    const message =
        document.getElementById(
            "searchMessage"
        );


    message.textContent =
        "🔎 Searching donors...";


    results.innerHTML = `

        <div class="empty-box">

            🔎 Searching...

        </div>

    `;


    try {

        const params =
            new URLSearchParams();


        if (blood) {

            params.append(
                "bloodGroup",
                blood
            );
        }


        if (city) {

            params.append(
                "city",
                city
            );
        }


        const url =
            API_URL +
            "/donors/search?" +
            params.toString();


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Search failed"
            );
        }


        const donors =
            await response.json();


        message.textContent =
            donors.length +
            " donor(s) found.";


        if (donors.length === 0) {

            results.innerHTML = `

                <div class="empty-box">

                    🩸

                    <h3>
                        No Donors Found
                    </h3>

                    <p>
                        Try another blood group or city.
                    </p>

                </div>

            `;

            return;
        }


        results.innerHTML = "";


        donors.forEach(function (donor) {

            const phone =
                String(
                    donor.phone || ""
                ).replace(
                    /[^0-9+]/g,
                    ""
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "donor-card";


            card.innerHTML = `

                <span class="blood-badge">

                    ${escapeHTML(
                        donor.bloodGroup
                    )}

                </span>


                <h3>

                    ${escapeHTML(
                        donor.name
                    )}

                </h3>


                <p>

                    📍 City:

                    ${escapeHTML(
                        donor.city || "Unknown"
                    )}

                </p>


                <p>

                    📞

                    <a
                        href="tel:${phone}"
                        class="phone-link">

                        ${escapeHTML(
                            donor.phone
                        )}

                    </a>

                </p>


                <a
                    href="tel:${phone}"
                    class="call-btn">

                    📞 Call Donor

                </a>

            `;


            results.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Search error:",
            error
        );


        message.textContent =
            "❌ Unable to search donors.";


        results.innerHTML = `

            <div class="empty-box">

                ❌

                <h3>
                    Server Connection Error
                </h3>

                <p>
                    Please make sure the backend is online.
                </p>

            </div>

        `;
    }
}


// =====================================================
// CLEAR SEARCH
// =====================================================

function clearSearch() {

    document.getElementById(
        "searchBlood"
    ).value = "";


    document.getElementById(
        "searchCity"
    ).value = "";


    document.getElementById(
        "searchMessage"
    ).textContent = "";


    document.getElementById(
        "donorResults"
    ).innerHTML = `

        <div class="empty-box">

            🩸

            <h3>
                Search for Blood Donors
            </h3>

            <p>
                Select a blood group or enter a city.
            </p>

        </div>

    `;
}


// =====================================================
// BLOOD COMPATIBILITY
// =====================================================

const bloodCompatibility = {

    "A+": {

        receive: [
            "A+",
            "A-",
            "O+",
            "O-"
        ],

        donate: [
            "A+",
            "AB+"
        ]
    },


    "A-": {

        receive: [
            "A-",
            "O-"
        ],

        donate: [
            "A+",
            "A-",
            "AB+",
            "AB-"
        ]
    },


    "B+": {

        receive: [
            "B+",
            "B-",
            "O+",
            "O-"
        ],

        donate: [
            "B+",
            "AB+"
        ]
    },


    "B-": {

        receive: [
            "B-",
            "O-"
        ],

        donate: [
            "B+",
            "B-",
            "AB+",
            "AB-"
        ]
    },


    "AB+": {

        receive: [
            "A+",
            "A-",
            "B+",
            "B-",
            "AB+",
            "AB-",
            "O+",
            "O-"
        ],

        donate: [
            "AB+"
        ]
    },


    "AB-": {

        receive: [
            "A-",
            "B-",
            "AB-",
            "O-"
        ],

        donate: [
            "AB-",
            "AB+"
        ]
    },


    "O+": {

        receive: [
            "O+",
            "O-"
        ],

        donate: [
            "O+",
            "A+",
            "B+",
            "AB+"
        ]
    },


    "O-": {

        receive: [
            "O-"
        ],

        donate: [
            "O+",
            "O-",
            "A+",
            "A-",
            "B+",
            "B-",
            "AB+",
            "AB-"
        ]
    }
};


// =====================================================
// SHOW COMPATIBILITY
// =====================================================

function showCompatibility() {

    const blood =
        document.getElementById(
            "compatibilityBlood"
        ).value;


    const result =
        document.getElementById(
            "compatibilityResult"
        );


    if (!blood) {

        result.innerHTML =
            "Select a blood group to see compatibility.";

        return;
    }


    const data =
        bloodCompatibility[blood];


    result.innerHTML = `

        <h3>

            ${blood} Blood Group

        </h3>


        <div class="compatibility-grid">


            <div class="compatibility-box">

                <strong>
                    🩸 Can Receive From
                </strong>

                <p>

                    ${data.receive.join(", ")}

                </p>

            </div>


            <div class="compatibility-box">

                <strong>
                    ❤️ Can Donate To
                </strong>

                <p>

                    ${data.donate.join(", ")}

                </p>

            </div>


        </div>

    `;
}


// =====================================================
// DONATION ELIGIBILITY
// =====================================================

function checkEligibility() {

    const age =
        Number(
            document.getElementById(
                "eligibilityAge"
            ).value
        );


    const lastDate =
        document.getElementById(
            "lastDonation"
        ).value;


    const result =
        document.getElementById(
            "eligibilityResult"
        );


    if (!age) {

        result.innerHTML =
            "⚠️ Please enter your age.";

        return;
    }


    if (age < 18 || age > 65) {

        result.innerHTML =
            "❌ Basic age range not satisfied.";

        return;
    }


    if (!lastDate) {

        result.innerHTML = `

            <strong>
                ✅ Basic age requirement satisfied.
            </strong>

            <p>
                Enter your last donation date
                for the interval check.
            </p>

        `;

        return;
    }


    const previous =
        new Date(lastDate);


    const today =
        new Date();


    const milliseconds =
        today.getTime() -
        previous.getTime();


    const days =
        Math.floor(
            milliseconds /
            (1000 * 60 * 60 * 24)
        );


    if (days < 0) {

        result.innerHTML =
            "⚠️ Please enter a valid previous donation date.";

        return;
    }


    if (days >= 56) {

        result.innerHTML = `

            <strong>
                ✅ Basic interval requirement satisfied.
            </strong>

            <p>
                ${days} days since your last donation.
            </p>

            <p>
                This is only a basic informational check.
                Final eligibility should be confirmed by
                a qualified blood-donation service.
            </p>

        `;

    } else {

        result.innerHTML = `

            <strong>
                ⏳ Donation interval not reached.
            </strong>

            <p>
                ${days} days since your last donation.
            </p>

            <p>
                Approximately
                ${56 - days}
                more days in this basic calculation.
            </p>

        `;
    }
}


// =====================================================
// WORLD LOCATION SEARCH
// =====================================================

async function searchLocation() {

    const input =
        document.getElementById(
            "locationInput"
        );


    const result =
        document.getElementById(
            "locationResult"
        );


    const message =
        document.getElementById(
            "locationMessage"
        );


    const location =
        input.value.trim();


    if (!location) {

        message.textContent =
            "⚠️ Enter a location.";

        return;
    }


    message.textContent =
        "🔎 Searching location...";


    result.innerHTML = `

        <div class="empty-box">

            🌍 Searching...

        </div>

    `;


    try {

        const url =
            "https://geocoding-api.open-meteo.com/v1/search" +
            "?name=" +
            encodeURIComponent(location) +
            "&count=5" +
            "&language=en" +
            "&format=json";


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Location API failed"
            );
        }


        const data =
            await response.json();


        if (
            !data.results ||
            data.results.length === 0
        ) {

            message.textContent =
                "❌ Location not found.";


            result.innerHTML = `

                <div class="empty-box">

                    ❌

                    <h3>
                        Location Not Found
                    </h3>

                    <p>
                        Try Chennai, Mumbai,
                        London or Tokyo.
                    </p>

                </div>

            `;

            return;
        }


        const place =
            data.results[0];


        const country =
            place.country ||
            "Unknown";


        const region =
            place.admin1 ||
            "Unknown";


        const latitude =
            Number(
                place.latitude
            ).toFixed(5);


        const longitude =
            Number(
                place.longitude
            ).toFixed(5);


        const population =
            place.population
                ? Number(
                    place.population
                ).toLocaleString()
                : "Unavailable";


        const mapURL =
            "https://www.google.com/maps/search/?api=1&query=" +
            latitude +
            "," +
            longitude;


        result.innerHTML = `

            <div class="location-card">

                <h2>

                    📍
                    ${escapeHTML(
                        place.name
                    )}

                </h2>


                <p>

                    ${escapeHTML(region)},
                    ${escapeHTML(country)}

                </p>


                <hr>


                <h3>

                    👥 Population

                </h3>


                <div class="population">

                    ${population}

                </div>


                <div class="compatibility-grid">


                    <div class="compatibility-box">

                        <strong>
                            🌐 Country
                        </strong>

                        <p>
                            ${escapeHTML(country)}
                        </p>

                    </div>


                    <div class="compatibility-box">

                        <strong>
                            🏛️ Region
                        </strong>

                        <p>
                            ${escapeHTML(region)}
                        </p>

                    </div>


                    <div class="compatibility-box">

                        <strong>
                            📍 Latitude
                        </strong>

                        <p>
                            ${latitude}
                        </p>

                    </div>


                    <div class="compatibility-box">

                        <strong>
                            📍 Longitude
                        </strong>

                        <p>
                            ${longitude}
                        </p>

                    </div>


                </div>


                <a
                    href="${mapURL}"
                    target="_blank"
                    rel="noopener"
                    class="primary-btn map-button">

                    🗺️ Open Location in Google Maps

                </a>

            </div>

        `;


        message.textContent =
            "✅ Location found.";


    } catch (error) {

        console.error(
            "Location error:",
            error
        );


        message.textContent =
            "❌ Unable to load location.";


        result.innerHTML = `

            <div class="empty-box">

                ❌

                <h3>
                    Location Service Error
                </h3>

                <p>
                    Check your internet connection
                    and try again.
                </p>

            </div>

        `;
    }
}


// =====================================================
// HTML SAFETY
// =====================================================

function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}
