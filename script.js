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

const apiUrl =
"https://script.google.com/macros/s/AKfycbyWdDE8bhaUhNqKjaHfwWbBIYcVBJF6fxxDTsaFyMY-c9UBe0YFC4Q_EuyusIc6YiMrfw/exec";


// ===============================
// Datastrukturer
// ===============================

const markerList = [];
const themeLayers = {};
const themeColors = {};
const visibleThemes = new Set();

let minYear = Infinity;
let maxYear = -Infinity;
let popupTimer = null;


// ===============================
// Temafarger
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

function createIcon(color){

    return L.divIcon({

        className:"",
        iconSize:[26,42],
        iconAnchor:[13,42],
        popupAnchor:[0,-36],

        html:`
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

.then(r=>r.json())

.then(data=>{

    const bounds=[];

    data.forEach(row=>{

        const lat=parseFloat(row.Latitude);
        const lng=parseFloat(row.Longitude);
        const year=parseInt(row.Dato);

        if(isNaN(lat) || isNaN(lng))
            return;

        if(isNaN(year))
            return;

        minYear=Math.min(minYear,year);
        maxYear=Math.max(maxYear,year);

        const theme=row.Tema ? row.Tema.trim() : "Annet";

        if(!themeColors[theme]){

            themeColors[theme]=colors[colorIndex%colors.length];

            themeLayers[theme]=L.layerGroup().addTo(map);

            visibleThemes.add(theme);

            colorIndex++;

        }

        const marker=L.marker(
            [lat,lng],
            {icon:createIcon(themeColors[theme])}
        );

        marker.addTo(themeLayers[theme]);

        marker.bindPopup(`
    <b>${row.Navn}</b><br>
    ${row.Beskrivelse||""}
    <br><br>
    <small><b>Tema:</b> ${theme}</small>
`, {
    autoClose: false,
    closeOnClick: false
});

        markerList.push({

            marker:marker,
            year:year,
            theme:theme,
            layer:themeLayers[theme],
            label:`<b>${row.Navn}</b><br>${row.Beskrivelse||""}`

        });

        bounds.push([lat,lng]);

    });

    if(bounds.length===1){

        map.setView(bounds[0],5);

    }

    else if(bounds.length>1){

        map.fitBounds(bounds,{
            padding:[40,40]
        });

    }

    setupTimeline();

    createLegend();

})

.catch(err=>console.error(err));

// ===============================
// Timeline
// ===============================

function setupTimeline(){

    if(markerList.length<=1)
        return;

    const container=document.getElementById("timelineContainer");
    const slider=document.getElementById("timelineSlider");

    container.style.display="flex";

    slider.min=minYear;
    slider.max=maxYear;
    slider.value=maxYear;

    document.getElementById("timelineMin").textContent=minYear;
    document.getElementById("timelineMax").textContent=maxYear;
    document.getElementById("timelineYear").textContent=maxYear;

    updateTimeline(maxYear);

    slider.addEventListener("input",function(){

        updateTimeline(parseInt(this.value));

    });

}


// ===============================
// Vis markører etter år
// ===============================

function updateTimeline(year){

    markerList.forEach(item=>{

        if(!visibleThemes.has(item.theme)){

            item.layer.removeLayer(item.marker);
            return;

        }

if(item.year<=year){

    const wasVisible = item.layer.hasLayer(item.marker);

    if(!wasVisible){

        item.layer.addLayer(item.marker);


        if (document.getElementById("autoPopup").checked) {

    clearTimeout(popupTimer);

    popupTimer = setTimeout(() => {

        if (!document.getElementById("autoPopup").checked)
            return;

        item.marker.openPopup();

        setTimeout(() => {
            item.marker.closePopup();
        }, 2000);

    }, 300);

}



        

    }

}

            
        else{

            if(item.layer.hasLayer(item.marker))
                item.layer.removeLayer(item.marker);

        }

    });

    document.getElementById("timelineYear").textContent=year;

}


// ===============================
// Oppdater slider etter temafilter
// ===============================

function updateTimelineRange(){

    const slider=document.getElementById("timelineSlider");
    const container=document.getElementById("timelineContainer");

    const years=markerList
        .filter(item=>visibleThemes.has(item.theme))
        .map(item=>item.year);

    if(years.length<=1){

        container.style.display="none";
        return;

    }

    container.style.display="flex";

    const min=Math.min(...years);
    const max=Math.max(...years);

    slider.min=min;
    slider.max=max;

    document.getElementById("timelineMin").textContent=min;
    document.getElementById("timelineMax").textContent=max;

    if(parseInt(slider.value)<min)
        slider.value=min;

    if(parseInt(slider.value)>max)
        slider.value=max;

    updateTimeline(parseInt(slider.value));

}

// ===============================
// Legend med filtrering
// ===============================

function createLegend(){

    const legend = L.control({position:"topleft"});

    legend.onAdd=function(){

        const div = L.DomUtil.create("div","legend themeLegend");

        div.innerHTML="<h4>Tema</h4>";

        Object.keys(themeColors).forEach(theme=>{

            const item=document.createElement("div");
            item.className="legend-item";
            item.style.cursor="pointer";

            const dot=document.createElement("span");
            dot.className="legend-color";
            dot.style.background=themeColors[theme];

            const text=document.createElement("span");
            text.textContent=theme;

            item.appendChild(dot);
            item.appendChild(text);

            let visible=true;

            item.onclick=function(){

                if(visible){

                    map.removeLayer(themeLayers[theme]);
                    visibleThemes.delete(theme);
                    item.style.opacity=0.35;

                }
                else{

                    map.addLayer(themeLayers[theme]);
                    visibleThemes.add(theme);
                    item.style.opacity=1;

                }

                visible=!visible;

                updateTimelineRange();

            };

            div.appendChild(item);

        });



        return div;

    };

    legend.addTo(map);

}


// ===============================
// Vis / skjul beskrivelser
// ===============================

document.getElementById("showLabels").addEventListener("change",function(){

    markerList.forEach(item=>{

        if(this.checked){

            item.marker.bindTooltip(

                item.label,

                {
                    permanent:true,
                    direction:"top",
                    offset:[0,-30],
                    opacity:0.9
                }

            );

            item.marker.openTooltip();

        }
        else{

            item.marker.closeTooltip();
            item.marker.unbindTooltip();

        }

    });

});

document.getElementById("autoPopup").addEventListener("change", function () {

    if (!this.checked) {

        clearTimeout(popupTimer);

        markerList.forEach(item => {
            item.marker.closePopup();
        });

    }

});

// ===============================
// Hindrer at kartet zoomer når
// man klikker i legend
// ===============================

map.on("overlayadd overlayremove",function(){

    map.invalidateSize();

});


// ===============================
// Hjelpefunksjon for oppfriskning
// ===============================

function refreshMap(){

    const slider=document.getElementById("timelineSlider");

    if(slider){

        updateTimeline(parseInt(slider.value));

    }

}


// ===============================
// Klar
// ===============================

console.log("Kart lastet.");
console.log("Antall markører:",markerList.length);
console.log("Script ferdig.");

console.log("VERSJON 23 JULI");

// ===============================
// Søkefelt
// ===============================

document.getElementById("searchButton").addEventListener("click", sendSearch);

document.getElementById("searchText").addEventListener("keydown", function(e){

    if(e.key==="Enter"){
        sendSearch();
    }

});

function sendSearch(){

    const text=document.getElementById("searchText").value.trim();

    console.log("Sender:", text);

    fetch(apiUrl + "?action=search&q=" + encodeURIComponent(text))
.then(r => r.json())
.then(result => {
    console.log(result);
});
