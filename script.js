// Del 1 av script.js kommer i neste melding fordi den er for stor til én chatmelding.
// Bruk denne index.html og style.css først.

// ===============================
// Kart
// ===============================

const map = L.map("map").setView([60.39, 8.46], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19
}).addTo(map);


// ===============================
// Google Sheet
// ===============================

const csvUrl =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vRbmg8CQbSRL3XQMZ3oKm0oQ9QZfcggIyV6SkHllStu5k1V20Dx2LCjvj14V8I6SNfrDfrnodRvilIp/pub?gid=778833914&single=true&output=csv";


// ===============================
// Datastrukturer
// ===============================

const markerList = [];
const themeLayers = {};
const themeColors = {};


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

Papa.parse(csvUrl, {

    download: true,
    header: true,
    dynamicTyping: true,

    complete: function(results) {

            console.log(results.data);

    const bounds = [];

        results.data.forEach(row => {

            // Hopper over tomme rader
            if (!row.Latitude || !row.Longitude) return;

            // ===============================
            // Tema
            // ===============================

            const theme = row.Tema ? row.Tema.trim() : "Annet";

            // Nytt tema får neste ledige farge
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

            const marker = L.marker(

                [row.Latitude, row.Longitude],

                {
                    icon: createIcon(color)
                }

            );

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

                label:
                    `<b>${row.Navn}</b><br>${row.Beskrivelse || ""}`,

                layer: themeLayers[theme]

            });

            bounds.push([row.Latitude, row.Longitude]);

        });


        // ===============================
        // Zoom kartet
        // ===============================

        if (bounds.length > 0) {

            map.fitBounds(bounds, {

                padding: [40,40]

            });

        }


        // ===============================
        // Lag legend
        // ===============================

        createLegend();

    }

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

            item.innerHTML = `
                <span class="legend-color"
                      style="background:${color}">
                </span>
                <span>${theme}</span>
            `;

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

console.log("Kart lastet.");
