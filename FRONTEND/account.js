// =========================================================
// BLOODLINK ACCOUNT MANAGEMENT
// =========================================================

(function () {

    const USER_STORAGE_KEY =
        "bloodlink_logged_in_user";

    const FOUNDER_TOKEN_KEY =
        "bloodlink_founder_token";


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
                "Unable to read logged-in user:",
                error
            );

            return null;
        }
    }


    function saveLoggedInUser(user) {

        if (!user) {
            localStorage.removeItem(
                USER_STORAGE_KEY
            );

            return;
        }

        localStorage.setItem(
            USER_STORAGE_KEY,
            JSON.stringify(user)
        );
    }


    function logoutUser() {

        localStorage.removeItem(
            USER_STORAGE_KEY
        );

        window.location.href =
            "login.html";
    }


    function getFounderToken() {

        return localStorage.getItem(
            FOUNDER_TOKEN_KEY
        );
    }


    function saveFounderToken(token) {

        if (token) {

            localStorage.setItem(
                FOUNDER_TOKEN_KEY,
                token
            );

        } else {

            localStorage.removeItem(
                FOUNDER_TOKEN_KEY
            );
        }
    }


    function logoutFounder() {

        localStorage.removeItem(
            FOUNDER_TOKEN_KEY
        );

        window.location.href =
            "admin-login.html";
    }


    function updateAccountUI() {

        const user =
            getLoggedInUser();

        const loginLinks =
            document.querySelectorAll(
                ".nav-login"
            );

        loginLinks.forEach(
            function (link) {

                if (!link) {
                    return;
                }

                if (user) {

                    link.textContent =
                        "Logout";

                    link.href =
                        "#";

                    link.onclick =
                        function (event) {

                            event.preventDefault();

                            logoutUser();
                        };

                } else {

                    link.textContent =
                        "Login";

                    link.href =
                        "login.html";

                    link.onclick =
                        null;
                }
            }
        );


        const accountName =
            document.getElementById(
                "accountName"
            );

        if (
            accountName &&
            user
        ) {

            accountName.textContent =
                user.name || "";
        }


        const accountPhone =
            document.getElementById(
                "accountPhone"
            );

        if (
            accountPhone &&
            user
        ) {

            accountPhone.textContent =
                user.phone || "";
        }
    }


    function requireLogin() {

        const user =
            getLoggedInUser();

        if (!user) {

            window.location.href =
                "login.html";

            return null;
        }

        return user;
    }


    function requireFounderLogin() {

        const token =
            getFounderToken();

        if (!token) {

            window.location.href =
                "admin-login.html";

            return null;
        }

        return token;
    }


    window.BloodLinkAccount = {

        getLoggedInUser:
            getLoggedInUser,

        saveLoggedInUser:
            saveLoggedInUser,

        logoutUser:
            logoutUser,

        getFounderToken:
            getFounderToken,

        saveFounderToken:
            saveFounderToken,

        logoutFounder:
            logoutFounder,

        updateAccountUI:
            updateAccountUI,

        requireLogin:
            requireLogin,

        requireFounderLogin:
            requireFounderLogin
    };


    document.addEventListener(
        "DOMContentLoaded",
        function () {

            updateAccountUI();
        }
    );

})();