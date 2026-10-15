/*
 * Admin Control Panel JavaScript
 *
 * Handles:
 * - Loading locations and bins
 * - Adding locations
 * - Deleting locations
 * - Adding bins
 * - Deleting bins
 * - Refreshing the tables
 */


const API = "/api";


// =====================================================
// DOM ELEMENTS
// =====================================================

const locationForm =
    document.getElementById(
        "locationForm"
    );

const locationName =
    document.getElementById(
        "locationName"
    );

const locationsTable =
    document.getElementById(
        "locationsTable"
    );

const binForm =
    document.getElementById(
        "binForm"
    );

const binId =
    document.getElementById(
        "binId"
    );

const binLocation =
    document.getElementById(
        "binLocation"
    );

const binsTable =
    document.getElementById(
        "binsTable"
    );

const adminMessage =
    document.getElementById(
        "adminMessage"
    );


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    message,
    type = "success"
) {

    adminMessage.textContent =
        message;

    adminMessage.className =
        `admin-message ${type}`;


    // Automatically hide.

    setTimeout(() => {

        adminMessage.className =
            "admin-message";

    }, 3500);
}


// =====================================================
// LOAD DATA
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
                "Failed to load data."
            );
        }


        const data =
            await response.json();


        renderLocations(
            data.locations
        );

        renderBins(
            data.locations
        );

        populateLocationSelect(
            data.locations
        );


    } catch (error) {

        console.error(error);

        showMessage(
            "Could not load data from server.",
            "error"
        );
    }
}


// =====================================================
// RENDER LOCATIONS
// =====================================================

function renderLocations(
    locations
) {

    locationsTable.innerHTML =
        "";


    if (locations.length === 0) {

        locationsTable.innerHTML = `
            <tr>
                <td
                    colspan="3"
                    class="empty-row"
                >
                    No locations registered.
                </td>
            </tr>
        `;

        return;
    }


    locations.forEach(
        location => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        location.name
                    )}
                </td>

                <td>
                    ${location.bins.length}
                </td>

                <td class="action-column">

                    <button
                        class="delete-button"
                        onclick='deleteLocation(
                            ${JSON.stringify(
                                location.name
                            )}
                        )'
                    >
                        Delete
                    </button>

                </td>

            `;


            locationsTable.appendChild(
                row
            );
        }
    );
}


// =====================================================
// POPULATE BIN LOCATION SELECT
// =====================================================

function populateLocationSelect(
    locations
) {

    const previousValue =
        binLocation.value;


    binLocation.innerHTML = `

        <option value="">
            Select location
        </option>

    `;


    locations.forEach(
        location => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                location.name;

            option.textContent =
                location.name;

            binLocation.appendChild(
                option
            );
        }
    );


    if (
        locations.some(
            location =>
                location.name ===
                previousValue
        )
    ) {

        binLocation.value =
            previousValue;
    }
}


// =====================================================
// RENDER BINS
// =====================================================

function renderBins(
    locations
) {

    binsTable.innerHTML =
        "";


    const allBins =
        locations.flatMap(
            location =>
                location.bins.map(
                    bin => ({
                        ...bin,
                        location:
                            location.name
                    })
                )
        );


    if (allBins.length === 0) {

        binsTable.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-row"
                >
                    No dustbins registered.
                </td>
            </tr>
        `;

        return;
    }


    allBins.forEach(
        bin => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        bin.id
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        bin.location
                    )}
                </td>

                <td>
                    ${bin.wetLevel}%
                </td>

                <td>
                    ${bin.dryLevel}%
                </td>

                <td class="action-column">

                    <button
                        class="delete-button"
                        onclick="deleteBin(
                            ${JSON.stringify(
                                bin.id
                            )}
                        )"
                    >
                        Delete
                    </button>

                </td>

            `;


            binsTable.appendChild(
                row
            );
        }
    );
}


// =====================================================
// ADD LOCATION
// =====================================================

locationForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            locationName.value.trim();


        if (!name) {

            showMessage(
                "Please enter a location name.",
                "error"
            );

            return;
        }


        try {

            const response =
                await fetch(
                    `${API}/locations`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name
                        })
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Unable to add location."
                );
            }


            locationForm.reset();


            showMessage(
                "Location added successfully."
            );


            await loadData();


        } catch (error) {

            showMessage(
                error.message,
                "error"
            );
        }
    }
);


// =====================================================
// DELETE LOCATION
// =====================================================

async function deleteLocation(
    name
) {

    const confirmed =
        confirm(
            `Delete "${name}"?\n\n` +
            `All bins assigned to this location ` +
            `will also be removed.`
        );


    if (!confirmed) {
        return;
    }


    try {
        const response =
            await fetch(
                `${API}/locations/` +
                encodeURIComponent(name),
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to delete location."
            );
        }


        showMessage(
            "Location deleted successfully."
        );


        await loadData();


    } catch (error) {

        showMessage(
            error.message,
            "error"
        );
    }
}


// =====================================================
// ADD BIN
// =====================================================

binForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const id =
            binId.value.trim();

        const location =
            binLocation.value;


        if (!id || !location) {

            showMessage(
                "Enter a Bin ID and select a location.",
                "error"
            );

            return;
        }


        try {

            const response =
                await fetch(
                    `${API}/bins`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            id,
                            location
                        })
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Unable to register bin."
                );
            }


            binForm.reset();


            showMessage(
                "Dustbin registered successfully."
            );


            await loadData();


        } catch (error) {

            showMessage(
                error.message,
                "error"
            );
        }
    }
);


// =====================================================
// DELETE BIN
// =====================================================

async function deleteBin(
    id
) {

    const confirmed =
        confirm(
            `Delete dustbin "${id}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/bins/` +
                encodeURIComponent(id),
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to delete bin."
            );
        }


        showMessage(
            "Dustbin deleted successfully."
        );


        await loadData();


    } catch (error) {

        showMessage(
            error.message,
            "error"
        );
    }
}


// =====================================================
// BASIC HTML ESCAPING
// =====================================================
//
// Prevents names entered through the admin form
// from being interpreted as HTML.
// =====================================================

function escapeHTML(value) {

    return String(value)
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


// =====================================================
// INITIALIZE
// =====================================================

loadData();