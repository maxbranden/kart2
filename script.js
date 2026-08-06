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
let inverted = false;
let singlePoint = false;

// ===============================
// Spiderfy
// ===============================

let spiderLayer = L.featureGroup().addTo(map);
let spiderOpen = false;
let spiderOriginals = [];


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

function createIcon(color, count = 1){

    return L.divIcon({

        className:"",
        iconSize:[26,42],
        iconAnchor:[13,42],
        popupAnchor:[0,-36],

       html: `
<div style="position:relative;width:26px;height:42px;">

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

    ${count > 1 ? `
    <div style="
        position:absolute;
        top:-2px;
        right:-4px;
        width:18px;
        height:18px;
        border-radius:50%;
        background:#d00;
        color:#fff;
        font-size:11px;
        font-weight:bold;
        display:flex;
        align-items:center;
        justify-content:center;
        border:2px solid white;
    ">
        ${count}
    </div>
    ` : ""}

</div>
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

  const imageHtml = row.Bilde
    ? `
        <div style="margin:8px 0;">
            <img src="${row.Bilde}"
                 style="
                    width:140px;
                    max-height:120px;
                    object-fit:cover;
                    border-radius:6px;
                    border:1px solid #ccc;
                    display:block;
                    margin:auto;
                 ">
        </div>`
    : "";

marker.bindPopup(`
    <b>${row.Navn}</b><br>
    ${row.Beskrivelse || ""}
    ${imageHtml}
    <small><b>Tema:</b> ${theme}</small>
`, {
    autoClose: false,
    closeOnClick: false
});

const markerInfo = {

    marker: marker,
    year: year,
    theme: theme,
    layer: themeLayers[theme],
    label:`<b>${row.Navn}</b><br>${row.Beskrivelse||""}`,

    lat: lat,
    lng: lng

};

marker._timelineData = markerInfo;

marker.on("click", function(e){

    console.log("Klikk registrert");

    L.DomEvent.stopPropagation(e);

    spiderfyGroup(this._timelineData);

});

markerList.push(markerInfo);

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

    updateMarkerCounts();

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

    slider.min=minYear - 1;
    slider.max=maxYear + 1;
    slider.value=maxYear +1;

    document.getElementById("timelineMin").textContent=minYear - 1;
    document.getElementById("timelineMax").textContent=maxYear + 1;
    document.getElementById("timelineYear").textContent=maxYear + 1;

    updateTimeline(maxYear);

    slider.addEventListener("input",function(){

        updateTimeline(parseInt(this.value));

    });

}


// ===============================
// Vis markører etter år
// ===============================

function updateTimeline(year){

    // Finn gjeldende markør dersom "singlePoint" er aktiv
    let currentYear = null;

if (singlePoint) {

    markerList.forEach(item => {

        if (!visibleThemes.has(item.theme))
            return;

        const valid = inverted
            ? item.year >= year
            : item.year <= year;

        if (!valid)
            return;

        if (currentYear === null) {

            currentYear = item.year;

        } else {

            if (!inverted && item.year > currentYear)
                currentYear = item.year;

            if (inverted && item.year < currentYear)
                currentYear = item.year;

        }

    });

}

    markerList.forEach(item=>{

        if(!visibleThemes.has(item.theme)){

            item.layer.removeLayer(item.marker);
            return;

        }

const show = singlePoint
    ? item.year === currentYear
    : (inverted
        ? item.year >= year
        : item.year <= year);

        if(show){

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

    document.getElementById("timelineYear").textContent = year;

    updateMarkerCounts();

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

    slider.min=min - 1;
    slider.max=max + 1;

    document.getElementById("timelineMin").textContent=min - 1;
    document.getElementById("timelineMax").textContent=max + 1;

    if(parseInt(slider.value)<min)
        slider.value=min;

    if(parseInt(slider.value)>max + 1)
        slider.value=max + 1;

    updateTimeline(parseInt(slider.value));

}

// ===============================
// Legend med filtrering
// ===============================

function createLegend(){

    const legend = L.control({position:"bottomleft"});

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
/*
document.getElementById("invertTimeline").addEventListener("change", function () {

    inverted = this.checked;
    refreshMap();

});

*/
document.getElementById("invertTimeline").addEventListener("change", function () {

    inverted = this.checked;

    const slider = document.getElementById("timelineSlider");

    console.log("Før:", slider.value, slider.min, slider.max);

    if (inverted) {
        slider.value = slider.min;
        slider.dispatchEvent(new Event("input"));
    } else {
        slider.value = slider.max;
        slider.dispatchEvent(new Event("input"));
    }

    console.log("Etter:", slider.value);

    updateTimeline(parseInt(slider.value));

});

document.getElementById("singlePoint").addEventListener("change", function () {
    singlePoint = this.checked;
    refreshMap();
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

console.log("SCRIPTVERSJON 08.06.01 SPIDERY");

// ===============================
// Update Marker Counts
// ===============================
    

    function updateMarkerCounts(){

    const groups = {};

    markerList.forEach(item => {

        if(!item.layer.hasLayer(item.marker))
            return;

        const key = item.lat + "," + item.lng;

        if(!groups[key])
            groups[key] = [];

        groups[key].push(item);

    });

    Object.values(groups).forEach(group => {

group.forEach(item => {

    item.count = group.length;

    item.marker.setIcon(
        createIcon(
            themeColors[item.theme],
            group.length
        )
    );

});

    });

}

function closeSpiderfy(){

    if(!spiderOpen)
        return;

    spiderLayer.clearLayers();

    spiderOriginals.forEach(item => {

        if(!item.layer.hasLayer(item.marker)){
            item.layer.addLayer(item.marker);
        }

    });

    spiderOriginals = [];
    spiderOpen = false;

}

// Legg denne rett etter funksjonen
map.on("click", function(){

    closeSpiderfy();

});

function spiderfyGroup(clickedItem){

       alert("SpiderfyGroup kjører!");

        // Ikke spiderfy i one-point mode
    if(singlePoint){
    item.marker.setIcon(
        createIcon(themeColors[item.theme],1)
    );
    return;
}

    closeSpiderfy();

    const group = markerList.filter(item =>

        item.layer.hasLayer(item.marker) &&
        item.lat === clickedItem.lat &&
        item.lng === clickedItem.lng

    );

    if(group.length <= 1){

        clickedItem.marker.openPopup();
        return;

    }

    spiderOpen = true;

    const center = L.latLng(clickedItem.lat, clickedItem.lng);

    const radius = 0.00035;   // ca. 35 meter

    group.forEach((item,index)=>{

        const angle = (2*Math.PI/group.length)*index;

        const lat = center.lat + radius*Math.cos(angle);
        const lng = center.lng + radius*Math.sin(angle);

const clone = L.marker([lat,lng],{

    icon: item.marker.getIcon(),
    zIndexOffset: 10000

});

        if(item.marker.getPopup()){

    clone.bindPopup(item.marker.getPopup().getContent());

}

clone.on("click", function(e){

    L.DomEvent.stopPropagation(e);

    this.openPopup();

});

console.log(lat, lng);

clone.addTo(spiderLayer);
        map.panTo([lat, lng]);

        /* NYTEST /////////////////////////////// */

        console.log(spiderLayer.getLayers().length);

// skjul originalmarkøren
item.layer.removeLayer(item.marker);

// husk den så vi kan legge den tilbake
spiderOriginals.push(item);

    });

}
