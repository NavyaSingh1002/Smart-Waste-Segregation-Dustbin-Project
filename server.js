/*
 * Smart Waste Management
 * IoT Waste Segregation Dustbin
 *
 * Backend:
 * Node.js + Express
 *
 * This prototype uses an in-memory JavaScript object
 * instead of MongoDB/SQL.
 *
 * Setup:
 *   npm init -y
 *   npm install express
 *   node server.js
 *
 * Open:
 *   http://localhost:3000
 */

const express = require("express");
const path = require("path");

const app = express();

const PORT = 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// =====================================================
// IN-MEMORY DATA STORE
// =====================================================

let locations = [
    {
        name: "Main Academic Block",

        bins: [
            {
                id: "BIN-MAB-001",

                lidState: "Closed",

                wetLevel: 42,

                dryLevel: 58,

                sensors: {
                    esp32: "Active",
                    moisture: "Standby",
                    ultrasonic: "Measuring"
                }
            },

            {
                id: "BIN-MAB-002",

                lidState: "Sorting",

                wetLevel: 76,

                dryLevel: 34,

                sensors: {
                    esp32: "Active",
                    moisture: "Detecting",
                    ultrasonic: "Measuring"
                }
            }
        ]
    },

    {
        name: "Central Library",

        bins: [
            {
                id: "BIN-LIB-001",

                lidState: "Closed",

                wetLevel: 25,

                dryLevel: 71,

                sensors: {
                    esp32: "Active",
                    moisture: "Standby",
                    ultrasonic: "Measuring"
                }
            }
        ]
    },

    {
        name: "College Cafeteria",

        bins: [
            {
                id: "BIN-CAF-001",

                lidState: "Open",

                wetLevel: 91,

                dryLevel: 64,

                sensors: {
                    esp32: "Active",
                    moisture: "Detecting",
                    ultrasonic: "Measuring"
                }
            }
        ]
    }
];


// =====================================================
// HELPER FUNCTIONS
// =====================================================

function findBin(binId) {

    for (const location of locations) {

        const bin =
            location.bins.find(
                item => item.id === binId
            );

        if (bin) {

            return {
                location,
                bin
            };
        }
    }

    return null;
}


// =====================================================
// GET /api/data
// =====================================================
//
// Returns the complete nested data structure.
//
// Example:
//
// {
//   locations: [
//      {
//        name: "...",
//        bins: [...]
//
//      }
//   ]
// }
// =====================================================

app.get("/api/data", (req, res) => {

    res.json({
        locations
    });
});


// =====================================================
// POST /api/locations
// =====================================================
//
// Add a new location.
//
// Request:
//
// {
//   "name": "New Block"
// }
// =====================================================

app.post("/api/locations", (req, res) => {

    const name =
        String(req.body.name || "").trim();


    if (!name) {

        return res.status(400).json({
            success: false,
            message: "Location name is required."
        });
    }


    // Prevent duplicate locations.

    const exists =
        locations.some(
            location =>
                location.name.toLowerCase() ===
                name.toLowerCase()
        );


    if (exists) {

        return res.status(409).json({
            success: false,
            message: "This location already exists."
        });
    }


    locations.push({
        name,
        bins: []
    });


    res.status(201).json({
        success: true,
        message: "Location added successfully."
    });
});


// =====================================================
// DELETE /api/locations/:name
// =====================================================
//
// Removes a location and all bins belonging to it.
//
// The frontend sends the location name encoded in URL.
// =====================================================

app.delete("/api/locations/:name", (req, res) => {

    const name =
        decodeURIComponent(req.params.name);


    const index =
        locations.findIndex(
            location =>
                location.name.toLowerCase() ===
                name.toLowerCase()
        );


    if (index === -1) {

        return res.status(404).json({
            success: false,
            message: "Location not found."
        });
    }


    locations.splice(index, 1);


    res.json({
        success: true,
        message: "Location deleted successfully."
    });
});


// =====================================================
// POST /api/bins
// =====================================================
//
// Add a new bin to an existing location.
//
// Request:
//
// {
//   "id": "BIN-NEW-001",
//   "location": "Main Academic Block"
// }
// =====================================================

app.post("/api/bins", (req, res) => {

    const id =
        String(req.body.id || "").trim();

    const locationName =
        String(req.body.location || "").trim();


    if (!id || !locationName) {

        return res.status(400).json({
            success: false,
            message: "Bin ID and location are required."
        });
    }


    // Check whether the Bin ID already exists.

    const existingBin =
        findBin(id);


    if (existingBin) {

        return res.status(409).json({
            success: false,
            message: "A bin with this ID already exists."
        });
    }


    // Find target location.

    const location =
        locations.find(
            item =>
                item.name.toLowerCase() ===
                locationName.toLowerCase()
        );


    if (!location) {

        return res.status(404).json({
            success: false,
            message: "Location not found."
        });
    }


    // Create a new bin.

    const newBin = {

        id,

        lidState: "Closed",

        wetLevel: 0,

        dryLevel: 0,

        sensors: {

            esp32: "Active",

            moisture: "Standby",

            ultrasonic: "Measuring"
        }
    };


    location.bins.push(newBin);


    res.status(201).json({
        success: true,
        message: "Bin registered successfully.",
        bin: newBin
    });
});


// =====================================================
// DELETE /api/bins/:id
// =====================================================

app.delete("/api/bins/:id", (req, res) => {

    const id =
        decodeURIComponent(req.params.id);


    const result =
        findBin(id);


    if (!result) {

        return res.status(404).json({
            success: false,
            message: "Bin not found."
        });
    }


    const binIndex =
        result.location.bins.findIndex(
            bin => bin.id === id
        );


    result.location.bins.splice(
        binIndex,
        1
    );


    res.json({
        success: true,
        message: "Bin deleted successfully."
    });
});


// =====================================================
// POST /api/ingest
// =====================================================
//
// Mock ESP32 endpoint.
//
// This is where the real ESP32 can eventually send
// sensor readings.
//
// Example:
//
// {
//   "binId": "BIN-MAB-001",
//   "wetLevel": 70,
//   "dryLevel": 55,
//   "lidState": "Sorting",
//   "sensors": {
//      "esp32": "Active",
//      "moisture": "Detecting",
//      "ultrasonic": "Measuring"
//   }
// }
// =====================================================

app.post("/api/ingest", (req, res) => {

    const {
        binId,
        wetLevel,
        dryLevel,
        lidState,
        sensors
    } = req.body;


    if (!binId) {

        return res.status(400).json({
            success: false,
            message: "binId is required."
        });
    }


    const result =
        findBin(binId);


    if (!result) {

        return res.status(404).json({
            success: false,
            message: "Bin not found."
        });
    }


    const bin =
        result.bin;


    // Update wet level.

    if (wetLevel !== undefined) {

        const value =
            Number(wetLevel);

        if (
            Number.isNaN(value) ||
            value < 0 ||
            value > 100
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "wetLevel must be between 0 and 100."
            });
        }

        bin.wetLevel = value;
    }


    // Update dry level.

    if (dryLevel !== undefined) {

        const value =
            Number(dryLevel);

        if (
            Number.isNaN(value) ||
            value < 0 ||
            value > 100
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "dryLevel must be between 0 and 100."
            });
        }

        bin.dryLevel = value;
    }


    // Update lid state.

    if (lidState !== undefined) {

        bin.lidState =
            String(lidState);
    }


    // Update sensor states.

    if (sensors !== undefined) {

        bin.sensors = {
            ...bin.sensors,
            ...sensors
        };
    }


    res.json({
        success: true,
        message: "ESP32 data received.",
        data: bin
    });
});


// =====================================================
// MOCK ESP32 DATA GENERATOR
// =====================================================
//
// This is ONLY for demonstration.
//
// Every 5 seconds, one random bin receives slightly
// changing values to make the dashboard appear live.
//
// Later, this can simply be removed when real ESP32
// hardware sends data to /api/ingest.
// =====================================================

setInterval(() => {

    const allBins = locations.flatMap(
        location => location.bins
    );


    if (allBins.length === 0) {
        return;
    }


    const bin =
        allBins[
            Math.floor(
                Math.random() * allBins.length
            )
        ];


    // Randomly increase/decrease levels.

    bin.wetLevel = Math.max(
        0,
        Math.min(
            100,
            bin.wetLevel +
                Math.floor(Math.random() * 5) - 1
        )
    );


    bin.dryLevel = Math.max(
        0,
        Math.min(
            100,
            bin.dryLevel +
                Math.floor(Math.random() * 5) - 1
        )
    );


    // Randomly simulate lid activity.

    const state =
        Math.random();


    if (state < 0.15) {

        bin.lidState = "Sorting";

        bin.sensors.moisture =
            "Detecting";

    } else if (state < 0.30) {

        bin.lidState = "Open";

        bin.sensors.moisture =
            "Standby";

    } else {

        bin.lidState = "Closed";

        bin.sensors.moisture =
            "Standby";
    }


    bin.sensors.esp32 =
        "Active";

    bin.sensors.ultrasonic =
        "Measuring";


    console.log(
        `[MOCK ESP32] ${bin.id}: Wet ${bin.wetLevel}% | Dry ${bin.dryLevel}% | ${bin.lidState}`
    );

}, 5000);


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log("");
    console.log(
        "=========================================="
    );

    console.log(
        " Smart Waste Management IoT Dashboard"
    );

    console.log(
        "=========================================="
    );

    console.log(
        `Running at http://localhost:${PORT}`
    );

    console.log("");
});