/*
 * Live Dashboard JavaScript
 *
 * Handles:
 * - Loading locations
 * - Loading bins based on location
 * - Fetching selected bin data
 * - Updating the dashboard
 * - Full-bin warnings
 * - Sensor diagnostics
 * - Auto-refresh every 3 seconds
 */


const API = "/api";


// =====================================================
// DOM ELEMENTS
// =====================================================

const locationSelect =
    document.getElementById(
        "locationSelect"
    );

const binSelect =
    document.getElementById(
        "binSelect"
    );

const connectionPill =
    document.getElementById(
        "connectionPill"
    );

const connectionText =
    document.getElementById(
        "connectionText"
    );

const currentBinId =
    document.getElementById(
        "currentBinId"
    );

const currentLocation =
    document.getElementById(
        "currentLocation"
    );

const lidState =
    document.getElementById(
        "lidState"
    );

const lidDescription =
    document.getElementById(
        "lidDescription"
    );

const lidIcon =
    document.getElementById(
        "lidIcon"
    );

const wetCard =
    document.getElementById(
        "wetCard"
    );

const dryCard =
    document.getElementById(
        "dryCard"
    );

const wetLevel =
    document.getElementById(
        "wetLevel"
    );

const dryLevel =
    document.getElementById(
        "dryLevel"
    );

const wetProgress =
    document.getElementById(
        "wetProgress"
    );

const dryProgress =
    document.getElementById(
        "dryProgress"
    );

const wetAlert =
    document.getElementById(
        "wetAlert"
    );

const dryAlert =
    document.getElementById(
        "dryAlert"
    );

const esp32Status =
    document.getElementById(
        "esp32Status"
    );

const moistureStatus =
    document.getElementById(
        "moistureStatus"
    );

const ultrasonicStatus =
    document.getElementById(
        "ultrasonicStatus"
    );

const esp32Dot =
    document.getElementById(
        "esp32Dot"
    );

const moistureDot =
    document.getElementById(
        "moistureDot"
    );

const ultrasonicDot =
    document.getElementById(
        "ultrasonicDot"
    );

const lastUpdated =
    document.getElementById(
        "lastUpdated"
    );


// =====================================================
// APPLICATION STATE
// =====================================================

let dashboardData = [];

let selectedBinId = null;


// =====================================================
// LOAD COMPLETE DATA
// =====================================================

async function loadData() {

    try {

        const response =
            await fetch(
                `${API}/data`,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to fetch dashboard data."
            );
        }


        const result =
            await response.json();


        dashboardData =
            result.locations || [];


        setConnection(true);


        populateLocations();


    } catch (error) {

        console.error(error);

        setConnection(false);
    }
}


// =====================================================
// POPULATE LOCATIONS
// =====================================================

function populateLocations() {

    const previousLocation =
        locationSelect.value;


    locationSelect.innerHTML = "";


    if (dashboardData.length === 0) {

        locationSelect.innerHTML =
            `<option value="">
                No locations available
            </option>`;

        binSelect.innerHTML =
            `<option value="">
                No bins available
            </option>`;

        return;
    }


    dashboardData.forEach(
        location => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                location.name;

            option.textContent =
                location.name;

            locationSelect.appendChild(
                option
            );
        }
    );


    // Preserve previous selection if possible.

    const locationExists =
        dashboardData.some(
            location =>
                location.name ===
                previousLocation
        );


    if (locationExists) {

        locationSelect.value =
            previousLocation;

    } else {

        locationSelect.value =
            dashboardData[0].name;
    }


    populateBins();
}


// =====================================================
// POPULATE BINS
// =====================================================

function populateBins() {

    const location =
        dashboardData.find(
            item =>
                item.name ===
                locationSelect.value
        );


    binSelect.innerHTML = "";


    if (!location || location.bins.length === 0) {

        binSelect.innerHTML =
            `<option value="">
                No bins registered
            </option>`;

        selectedBinId = null;

        showEmptyDashboard();

        return;
    }


    location.bins.forEach(
        bin => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                bin.id;

            option.textContent =
                bin.id;

            binSelect.appendChild(
                option
            );
        }
    );


    const binStillExists =
        location.bins.some(
            bin =>
                bin.id ===
                selectedBinId
        );


    if (binStillExists) {

        binSelect.value =
            selectedBinId;

    } else {

        binSelect.value =
            location.bins[0].id;

        selectedBinId =
            location.bins[0].id;
    }


    renderSelectedBin();
}


// =====================================================
// LOCATION CHANGE
// =====================================================

locationSelect.addEventListener(
    "change",
    () => {

        selectedBinId = null;

        populateBins();
    }
);


// =====================================================
// BIN CHANGE
// =====================================================

binSelect.addEventListener(
    "change",
    () => {

        selectedBinId =
            binSelect.value;

        renderSelectedBin();
    }
);


// =====================================================
// RENDER SELECTED BIN
// =====================================================

function renderSelectedBin() {

    const location =
        dashboardData.find(
            item =>
                item.name ===
                locationSelect.value
        );


    if (!location) {
        return;
    }


    const bin =
        location.bins.find(
            item =>
                item.id ===
                binSelect.value
        );


    if (!bin) {
        return;
    }


    selectedBinId =
        bin.id;


    currentBinId.textContent =
        bin.id;

    currentLocation.textContent =
        location.name;


    updateConnection(
        bin
    );

    updateLid(
        bin.lidState
    );

    updateWaste(
        bin.wetLevel,
        wetLevel,
        wetProgress,
        wetCard,
        wetAlert
    );

    updateWaste(
        bin.dryLevel,
        dryLevel,
        dryProgress,
        dryCard,
        dryAlert
    );

    updateSensor(
        bin.sensors.esp32,
        esp32Status,
        esp32Dot
    );

    updateSensor(
        bin.sensors.moisture,
        moistureStatus,
        moistureDot
    );

    updateSensor(
        bin.sensors.ultrasonic,
        ultrasonicStatus,
        ultrasonicDot
    );


    lastUpdated.textContent =
        `Last updated: ${
            new Date().toLocaleTimeString()
        }`;
}


// =====================================================
// UPDATE CONNECTION
// =====================================================

function updateConnection(bin) {

    const online =
        bin.connection !== "Offline";


    setConnection(online);
}


function setConnection(online) {

    connectionPill.classList.toggle(
        "online",
        online
    );

    connectionPill.classList.toggle(
        "offline",
        !online
    );


    connectionText.textContent =
        online
            ? "Connected"
            : "Disconnected";
}


// =====================================================
// UPDATE LID
// =====================================================

function updateLid(state) {

    lidState.textContent =
        state;


    if (state === "Sorting") {

        lidIcon.textContent =
            "⚙️";

        lidDescription.textContent =
            "Waste is being classified and sorted.";

    } else if (state === "Open") {

        lidIcon.textContent =
            "🔓";

        lidDescription.textContent =
            "Lid is open and waiting for waste.";

    } else {

        lidIcon.textContent =
            "🗑️";

        lidDescription.textContent =
            "Dustbin is idle and ready.";
    }
}


// =====================================================
// UPDATE WASTE LEVEL
// =====================================================

function updateWaste(
    value,
    levelElement,
    progressElement,
    cardElement,
    alertElement
) {

    let level =
        Number(value);


    if (Number.isNaN(level)) {

        level = 0;
    }


    level =
        Math.max(
            0,
            Math.min(100, level)
        );


    levelElement.textContent =
        `${Math.round(level)}%`;


    progressElement.style.width =
        `${level}%`;


    if (level >= 85) {

        cardElement.classList.add(
            "warning"
        );

        alertElement.className =
            "warning";

        alertElement.textContent =
            "⚠️ Bin Full";

    } else {

        cardElement.classList.remove(
            "warning"
        );

        alertElement.className =
            "normal";

        alertElement.textContent =
            "Normal";
    }
}


// =====================================================
// UPDATE SENSOR
// =====================================================

function updateSensor(
    status,
    textElement,
    dotElement
) {

    textElement.textContent =
        status;


    const unavailable =
        status === "Inactive" ||
        status === "Unavailable";


    dotElement.classList.toggle(
        "offline",
        unavailable
    );

    textElement.style.color =
        unavailable
            ? "#d32f2f"
            : "#2e7d32";
}


// =====================================================
// EMPTY DASHBOARD
// =====================================================

function showEmptyDashboard() {

    currentBinId.textContent =
        "No bin";

    currentLocation.textContent =
        "No location selected";

    lidState.textContent =
        "No Data";

    lidDescription.textContent =
        "Register a dustbin from the Admin Panel.";

    wetLevel.textContent =
        "0%";

    dryLevel.textContent =
        "0%";

    wetProgress.style.width =
        "0%";

    dryProgress.style.width =
        "0%";
}


// =====================================================
// AUTO REFRESH
// =====================================================
//
// Every 3 seconds, fetch fresh server data.
//
// This means:
// ESP32 → Server → Dashboard
//
// without refreshing the browser.
// =====================================================

setInterval(
    async () => {

        try {

            const response =
                await fetch(
                    `${API}/data`,
                    {
                        cache: "no-store"
                    }
                );


            if (!response.ok) {
                throw new Error(
                    "Server unavailable"
                );
            }


            const result =
                await response.json();


            dashboardData =
                result.locations || [];


            setConnection(true);


            // Re-render dropdowns and
            // currently selected bin.

            populateLocations();

        } catch (error) {

            console.error(error);

            setConnection(false);
        }

    },
    3000
);


// =====================================================
// INITIAL LOAD
// =====================================================

loadData();