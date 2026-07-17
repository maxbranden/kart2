const map = L.map('map').setView([60.39, 8.46], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Bytt ut med din egen Google Sheet-ID
const sheet = 'https://opensheet.elk.sh/DIN_SHEET_ID/Ark1';

fetch(sheet)
    .then(response => response.json())
    .then(data => {
        const markers = [];

        data.forEach(row => {
            const lat = parseFloat(row.Latitude);
            const lng = parseFloat(row.Longitude);

            if (isNaN(lat) || isNaN(lng)) return;

            const marker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`
                    <strong>${row.Navn || ''}</strong><br>
                    ${row.Beskrivelse || ''}
                `);

            markers.push(marker);
        });

        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.2));
        }
    })
    .catch(error => console.error('Feil ved henting av data:', error));