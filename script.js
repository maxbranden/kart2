// Opprett kart
const map = L.map('map').setView([60.39, 8.46], 5);

// OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Google Sheet (CSV)
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRbmg8CQbSRL3XQMZ3oKm0oQ9QZfcggIyV6SkHllStu5k1V20Dx2LCjvj14V8I6SNfrDfrnodRvilIp/pub?gid=778833914&single=true&output=csv";

const markerList = [];

Papa.parse(csvUrl, {
    download: true,
    header: true,
    dynamicTyping: true,

    complete: function(results) {

        const markers = [];

        results.data.forEach(row => {

            if (row.Latitude == null || row.Longitude == null) return;

            const marker = L.marker([row.Latitude, row.Longitude]).addTo(map);

            marker.bindPopup(`
                <b>${row.Navn}</b><br>
                ${row.Beskrivelse || ""}
            `);

            markerList.push({
                marker: marker,
                label: `<b>${row.Navn}</b><br>${row.Beskrivelse || ""}`
            });

            markers.push(marker);

        });

        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.2));
        }
    }
});

// Checkbox
document.getElementById("showLabels").addEventListener("change", function () {

    markerList.forEach(item => {

        if (this.checked) {

            item.marker.bindTooltip(item.label, {
                permanent: true,
                direction: "top",
                offset: [0, -10]
            });

            item.marker.openTooltip();

        } else {

            item.marker.closeTooltip();
            item.marker.unbindTooltip();

        }

    });

});
