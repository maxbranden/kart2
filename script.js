const map = L.map('map').setView([60.39, 8.46], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTOQZlP2tl0K1kY645kZR6fTzZT6jnatg71BXvMVXqKcxpoJ5s0PjGMMFbFKfBh4nteU7s6t7xYb8aA/pub?gid=0&single=true&output=csv";

Papa.parse(csvUrl, {
    download: true,
    header: true,
    dynamicTyping: true,

    complete: function(results) {

        const markers = [];

        results.data.forEach(row => {

            if (!row.Latitude || !row.Longitude) return;

            const marker = L.marker([row.Latitude, row.Longitude])
                .addTo(map)
                .bindPopup(
                    `<b>${row.Navn}</b><br>${row.Beskrivelse}`
                );

            markers.push(marker);

        });

        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.2));
        }
    }
});
