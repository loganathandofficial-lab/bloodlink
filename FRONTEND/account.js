// =========================================================
// BLOODLINK ACCOUNT / LOGOUT
// =========================================================

(function () {
    "use strict";

    const LOGGED_IN_USER_KEY =
        "bloodlink_logged_in_user";

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
                "Unable to read login session:",
                error
            );

            return null;
        }
    }

    function logoutUser() {
        localStorage.removeItem(
            LOGGED_IN_USER_KEY
        );

        localStorage.removeItem(
            "bloodlink_donor_id"
        );

        window.location.href =
            "login.html";
    }

    function createAccountMenu() {

        const user =
            getLoggedInUser();

        const navMenu =
            document.querySelector(
                ".nav-menu"
            );

        if (!navMenu) {
            return;
        }

        const existingAccount =
            document.getElementById(
                "bloodlinkAccountMenu"
            );

        if (existingAccount) {
            existingAccount.remove();
        }

        const existingLogin =
            navMenu.querySelector(
                'a[href="login.html"]'
            );

        if (!user) {
            return;
        }

        if (existingLogin) {
            existingLogin.style.display =
                "none";
        }

        const wrapper =
            document.createElement("div");

        wrapper.id =
            "bloodlinkAccountMenu";

        wrapper.style.position =
            "relative";

        wrapper.style.display =
            "inline-block";

        const accountButton =
            document.createElement("button");

        accountButton.type =
            "button";

        accountButton.textContent =
            `👤 ${user.name || "Account"} ▾`;

        accountButton.style.border =
            "none";

        accountButton.style.background =
            "#fff0f3";

        accountButton.style.color =
            "#65091d";

        accountButton.style.padding =
            "10px 14px";

        accountButton.style.borderRadius =
            "10px";

        accountButton.style.fontWeight =
            "700";

        accountButton.style.cursor =
            "pointer";

        const dropdown =
            document.createElement("div");

        dropdown.style.display =
            "none";

        dropdown.style.position =
            "absolute";

        dropdown.style.right =
            "0";

        dropdown.style.top =
            "calc(100% + 8px)";

        dropdown.style.minWidth =
            "190px";

        dropdown.style.background =
            "#ffffff";

        dropdown.style.border =
            "1px solid #ead9de";

        dropdown.style.borderRadius =
            "12px";

        dropdown.style.padding =
            "8px";

        dropdown.style.boxShadow =
            "0 12px 30px rgba(0,0,0,0.12)";

        dropdown.style.zIndex =
            "9999";

        const profileText =
            document.createElement("div");

        profileText.style.padding =
            "10px";

        profileText.style.fontSize =
            "13px";

        profileText.style.color =
            "#6f555d";

        profileText.innerHTML =
            `
            <strong style="color:#65091d;">
                ${user.name || "User"}
            </strong>
            <br>
            ${user.email || ""}
            ${
                user.phone
                    ? `<br>${user.phone}`
                    : ""
            }
            `;

        const logoutButton =
            document.createElement("button");

        logoutButton.type =
            "button";

        logoutButton.textContent =
            "🚪 Logout";

        logoutButton.style.width =
            "100%";

        logoutButton.style.border =
            "none";

        logoutButton.style.borderRadius =
            "9px";

        logoutButton.style.padding =
            "10px";

        logoutButton.style.background =
            "#8d1028";

        logoutButton.style.color =
            "#ffffff";

        logoutButton.style.fontWeight =
            "700";

        logoutButton.style.cursor =
            "pointer";

        logoutButton.addEventListener(
            "click",
            function () {

                const confirmed =
                    window.confirm(
                        "Are you sure you want to logout?"
                    );

                if (confirmed) {
                    logoutUser();
                }
            }
        );

        accountButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                dropdown.style.display =
                    dropdown.style.display ===
                    "block"
                        ? "none"
                        : "block";
            }
        );

        dropdown.appendChild(
            profileText
        );

        dropdown.appendChild(
            logoutButton
        );

        wrapper.appendChild(
            accountButton
        );

        wrapper.appendChild(
            dropdown
        );

        navMenu.appendChild(
            wrapper
        );

        document.addEventListener(
            "click",
            function () {
                dropdown.style.display =
                    "none";
            }
        );
    }

    function protectDonorPage() {

        const isDonorPage =
            window.location.pathname
                .toLowerCase()
                .endsWith(
                    "donor.html"
                );

        if (!isDonorPage) {
            return;
        }

        const user =
            getLoggedInUser();

        if (!user) {

            window.alert(
                "Please login first to register as a blood donor."
            );

            window.location.href =
                "login.html";
        }
    }

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            protectDonorPage();

            createAccountMenu();
        }
    );

    window.bloodlinkLogout =
        logoutUser;

    window.bloodlinkGetUser =
        getLoggedInUser;

})();