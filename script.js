
// Del 1 av script.js kommer i neste melding fordi den er for stor til én chatmelding.
// Bruk denne index.html og style.css først.

// ===============================
// Kart
// ===============================

const map = L.map("map").setView([60.39, 8.46], 5);

console.log("Kart opprettet");

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19
}).addTo(map);

console.log("Kartlag lagt til");




// ===============================
// Google Sheet
// ===============================


const apiUrl =
"https://script.google.com/macros/s/AKfycbyWdDE8bhaUhNqKjaHfwWbBIYcVBJF6fxxDTsaFyMY-c9UBe0YFC4Q_EuyusIc6YiMrfw/exec";

// ===============================
// Datastrukturer
// ===============================

const markerList = [];
const themeLayers = {};
const themeColors = {};

let minYear = Infinity;
let maxYear = -Infinity;


// ===============================
// Opptil 11 temafarger
// ===============================

const colors = [
    "#d73027",
    "#4575b4",
    "#1a9850",
    "#984ea3",
    "#ff7f00",
    "#e6ab02",
    "#66a61e",
    "#a6761d",
    "#f781bf",
    "#7570b3",
    "#666666"
];

let colorIndex = 0;


// ===============================
// SVG-ikon
// ===============================

function createIcon(color) {

    return L.divIcon({

        className: "",

        iconSize: [26, 42],

        iconAnchor: [13, 42],

        popupAnchor: [0, -36],

        html: `
        <svg width="26" height="42" viewBox="0 0 26 42">

            <path
                d="M13 0
                   C6 0 0 6 0 13
                   C0 23 13 42 13 42
                   C13 42 26 23 26 13
                   C26 6 20 0 13 0Z"
                fill="${color}"
                stroke="#333"
                stroke-width="1.4"/>

            <circle
                cx="13"
                cy="13"
                r="5"
                fill="white"/>

        </svg>
        `
    });

}

// ===============================
// Les Google Sheet
// ===============================

fetch(apiUrl)
.then(response => response.json())
.then(data => {

    console.log("Data hentet");

    console.log(data);

    const bounds = [];

    data.forEach(row => {

        // Hopper over tomme rader

        const lat = parseFloat(row.Latitude);
        const lng = parseFloat(row.Longitude);

        const year = parseInt(row.Dato);

if (isNaN(year)) {
    console.log("Mangler gyldig år:", row);
    return;
}

minYear = Math.min(minYear, year);
maxYear = Math.max(maxYear, year);

        if (isNaN(lat) || isNaN(lng)) {
            console.log("Hopper over rad:", row);
            return;
        }

        // ===============================
        // Tema
        // ===============================

        const theme = row.Tema ? row.Tema.trim() : "Annet";

        if (!themeColors[theme]) {

            themeColors[theme] =
                colors[colorIndex % colors.length];

            themeLayers[theme] = L.layerGroup().addTo(map);

            colorIndex++;

        }

        const color = themeColors[theme];

        // ===============================
        // Marker
        // ===============================

        const marker = L.marker([lat, lng], {
            icon: createIcon(color)
        });

        marker.addTo(themeLayers[theme]);

        // ===============================
        // Popup
        // ===============================

        marker.bindPopup(`
            <b>${row.Navn}</b><br>
            ${row.Beskrivelse || ""}
            <br><br>
            <small><b>Tema:</b> ${theme}</small>
        `);

        // ===============================
        // Tooltip
        // ===============================

markerList.push({

    marker: marker,
    year: year,

    label: `<b>${row.Navn}</b><br>${row.Beskrivelse || ""}`,

    layer: themeLayers[theme]

});

        bounds.push([lat, lng]);

    });

// ===============================
// Zoom kartet
// ===============================

if (bounds.length === 1) {

    // Kun én lokasjon – bruk zoomnivå 5
    map.setView(bounds[0], 5);

} else if (bounds.length > 1) {

    // Flere lokasjoner – tilpass utsnittet automatisk
    map.fitBounds(bounds, {
        padding: [40, 40]
    });

}



    // ===============================
// Timeline
// ===============================

if (markerList.length > 1) {

    const container = document.getElementById("timelineContainer");
    const slider = document.getElementById("timelineSlider");

    container.style.display = "flex";

    slider.min = minYear;
    slider.max = maxYear;
    slider.value = maxYear;

    document.getElementById("timelineMin").textContent = minYear;
    document.getElementById("timelineMax").textContent = maxYear;
    document.getElementById("timelineYear").textContent =
        "År: " + maxYear;

}



        // ===============================
    // Lag legend
    // ===============================

    createLegend();

})
.catch(error => {

    console.error("Kunne ikke hente data:", error);

});


// ===============================
// Legend med filtrering
// ===============================

function createLegend() {

    const legend = L.control({ position: "topleft" });

    legend.onAdd = function () {

        const div = L.DomUtil.create("div", "legend");

        div.innerHTML = "<h4>Tema</h4>";

        Object.keys(themeColors).forEach(theme => {

            const color = themeColors[theme];

            const item = document.createElement("div");
            item.className = "legend-item";

const colorDot = document.createElement("span");
colorDot.className = "legend-color";
colorDot.style.background = color;

const text = document.createElement("span");
text.textContent = theme;

item.appendChild(colorDot);
item.appendChild(text);

            item.style.cursor = "pointer";

            let visible = true;

            item.onclick = function () {

                if (visible) {

                    map.removeLayer(themeLayers[theme]);

                    item.style.opacity = 0.35;

                } else {

                    map.addLayer(themeLayers[theme]);

                    item.style.opacity = 1;

                }

                visible = !visible;

            };

            div.appendChild(item);

        });

        return div;

    };

    legend.addTo(map);

}

// ===============================
// Vis / skjul etiketter
// ===============================

document.getElementById("showLabels").addEventListener("change", function () {

    markerList.forEach(item => {

        if (this.checked) {

            item.marker.bindTooltip(
                item.label,
                {
                    permanent: true,
                    direction: "top",
                    offset: [0, -30],
                    opacity: 0.9
                }
            );

            item.marker.openTooltip();

        } else {

            item.marker.closeTooltip();
            item.marker.unbindTooltip();

        }

    });

});


// ===============================
// Hindrer at kartet zoomer når man
// klikker i legend
// ===============================

map.on("overlayadd overlayremove", function () {

    map.invalidateSize();

});


// ===============================
// Ferdig!
// ===============================

console.log("NY SCRIPT 2026");

