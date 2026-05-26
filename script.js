/* =========================================
   ROUTIFY - SCRIPT COMPLETO
========================================= */

/* =========================================
   MAPA
========================================= */

const map = L.map('map', {
    zoomControl: true
}).setView([-2.5307, -44.3068], 13);

/* =========================================
   OPEN STREET MAP
========================================= */

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

/* =========================================
   DADOS INICIAIS
========================================= */

let deliveries = [
    {
        id: 1,
        client: "João Silva",
        street: "Rua da Paz",
        number: "120",
        district: "Centro",
        city: "São Luís",
        lat: -2.5307,
        lng: -44.3068,
        status: "pending"
    },

    {
        id: 2,
        client: "Maria Souza",
        street: "Rua da Paz",
        number: "150",
        district: "Centro",
        city: "São Luís",
        lat: -2.5312,
        lng: -44.3070,
        status: "route"
    },

    {
        id: 3,
        client: "Carlos Lima",
        street: "Rua Verde",
        number: "55",
        district: "Renascença",
        city: "São Luís",
        lat: -2.5400,
        lng: -44.3000,
        status: "done"
    }
];

/* =========================================
   ELEMENTOS
========================================= */

const deliveryList = document.getElementById("deliveryList");

const totalDeliveries = document.getElementById("totalDeliveries");

const groupedStreets = document.getElementById("groupedStreets");

/* =========================================
   MARKERS
========================================= */

let markers = [];

/* =========================================
   INICIALIZAR
========================================= */

initialize();

/* =========================================
   FUNÇÃO PRINCIPAL
========================================= */

function initialize() {

    renderDashboard();

    renderDeliveries();

    renderMap();

}

/* =========================================
   DASHBOARD
========================================= */

function renderDashboard() {

    totalDeliveries.innerHTML = deliveries.length;

    const streets = {};

    deliveries.forEach(item => {

        if (!streets[item.street]) {
            streets[item.street] = 0;
        }

        streets[item.street]++;

    });

    groupedStreets.innerHTML = Object.keys(streets).length;

}

/* =========================================
   AGRUPAR RUAS
========================================= */

function groupByStreet() {

    const grouped = {};

    deliveries.forEach(item => {

        if (!grouped[item.street]) {
            grouped[item.street] = [];
        }

        grouped[item.street].push(item);

    });

    return grouped;

}

/* =========================================
   RENDERIZAR LISTA
========================================= */

function renderDeliveries() {

    deliveryList.innerHTML = "";

    const grouped = groupByStreet();

    deliveries.forEach(item => {

        let statusClass = "";

        let statusText = "";

        switch(item.status){

            case "pending":
                statusClass = "pending";
                statusText = "Pendente";
            break;

            case "route":
                statusClass = "route";
                statusText = "Em Rota";
            break;

            case "done":
                statusClass = "done";
                statusText = "Entregue";
            break;

        }

        const card = document.createElement("div");

        card.classList.add("delivery");

        card.innerHTML = `

            <h3>${item.client}</h3>

            <p>${item.street}, ${item.number}</p>

            <p>${item.district} - ${item.city}</p>

            <div class="street-badge">
                📍 ${grouped[item.street].length} entregas nesta rua
            </div>

            <div class="status">

                <div class="tag ${statusClass}">
                    ${statusText}
                </div>

                <button class="route-btn"
                    onclick="focusDelivery(${item.lat}, ${item.lng})">
                    Ver rota
                </button>

            </div>

        `;

        deliveryList.appendChild(card);

    });

}

/* =========================================
   MAPA
========================================= */

function renderMap() {

    clearMarkers();

    const grouped = groupByStreet();

    deliveries.forEach(item => {

        let color = "#dc2626";

        if(item.status === "route"){
            color = "#eab308";
        }

        if(item.status === "done"){
            color = "#16a34a";
        }

        const marker = L.circleMarker([item.lat, item.lng], {

            radius: 12,
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            weight: 2

        }).addTo(map);

        marker.bindPopup(`

            <div style="width:220px">

                <h3 style="margin-bottom:10px">
                    ${item.client}
                </h3>

                <p>
                    ${item.street}, ${item.number}
                </p>

                <p>
                    ${item.district}
                </p>

                <br>

                <strong>
                    📦 ${grouped[item.street].length} entregas nesta rua
                </strong>

            </div>

        `);

        markers.push(marker);

    });

}

/* =========================================
   LIMPAR MARKERS
========================================= */

function clearMarkers(){

    markers.forEach(marker => {

        map.removeLayer(marker);

    });

    markers = [];

}

/* =========================================
   FOCAR ENTREGA
========================================= */

function focusDelivery(lat, lng){

    map.setView([lat, lng], 17);

}

/* =========================================
   IMPORTAÇÃO EXCEL
========================================= */

document.getElementById('excelFile')
.addEventListener('change', handleExcelUpload);

/* =========================================
   PROCESSAR EXCEL
========================================= */

function handleExcelUpload(event){

    const file = event.target.files[0];

    if(!file){

        alert("Selecione um arquivo.");

        return;

    }

    const reader = new FileReader();

    reader.onload = function(e){

        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, {
            type: 'array'
        });

        const sheetName = workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json(sheet);

        importDeliveries(json);

    };

    reader.readAsArrayBuffer(file);

}

/* =========================================
   IMPORTAR ENTREGAS
========================================= */

async function importDeliveries(data){

    for(const item of data){

        try{

            const address = `
                ${item.rua || ""}
                ${item.numero || ""}
                ${item.bairro || ""}
                ${item.cidade || "São Luís"}
            `;

            const coords = await geocodeAddress(address);

            deliveries.push({

                id: Date.now() + Math.random(),

                client: item.cliente || "Cliente",

                street: item.rua || "Rua",

                number: item.numero || "0",

                district: item.bairro || "Centro",

                city: item.cidade || "São Luís",

                lat: coords.lat,

                lng: coords.lng,

                status: "pending"

            });

        }catch(error){

            console.error("Erro:", error);

        }

    }

    renderDashboard();

    renderDeliveries();

    renderMap();

    alert("Entregas importadas com sucesso!");

}

/* =========================================
   GEOLOCALIZAÇÃO
========================================= */

async function geocodeAddress(address){

    const url = `
https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}
    `;

    const response = await fetch(url);

    const data = await response.json();

    if(data.length === 0){

        return {

            lat: -2.5307,
            lng: -44.3068

        };

    }

    return {

        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)

    };

}

/* =========================================
   BUSCA
========================================= */

function searchStreet(term){

    const cards = document.querySelectorAll(".delivery");

    cards.forEach(card => {

        const text = card.innerText.toLowerCase();

        if(text.includes(term.toLowerCase())){

            card.style.display = "block";

        }else{

            card.style.display = "none";

        }

    });

}

/* =========================================
   GEOLOCALIZAÇÃO USUÁRIO
========================================= */

function locateUser(){

    if(navigator.geolocation){

        navigator.geolocation.getCurrentPosition(position => {

            const lat = position.coords.latitude;

            const lng = position.coords.longitude;

            map.setView([lat, lng], 15);

            L.marker([lat, lng])
            .addTo(map)
            .bindPopup("Sua localização")
            .openPopup();

        });

    }

}

/* =========================================
   FILTRAR STATUS
========================================= */

function filterStatus(status){

    const cards = document.querySelectorAll(".delivery");

    cards.forEach((card, index) => {

        if(status === "all"){

            card.style.display = "block";

            return;

        }

        if(deliveries[index].status === status){

            card.style.display = "block";

        }else{

            card.style.display = "none";

        }

    });

}

/* =========================================
   CALCULAR DISTÂNCIA
========================================= */

function calculateDistance(lat1, lon1, lat2, lon2){

    const R = 6371;

    const dLat = deg2rad(lat2-lat1);

    const dLon = deg2rad(lon2-lon1);

    const a =

        Math.sin(dLat/2) *
        Math.sin(dLat/2) +

        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *

        Math.sin(dLon/2) *
        Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;

}

function deg2rad(deg){

    return deg * (Math.PI/180);

}

/* =========================================
   OTIMIZAR ROTAS
========================================= */

function optimizeRoutes(){

    deliveries.sort((a,b) => {

        return a.street.localeCompare(b.street);

    });

    renderDeliveries();

}

/* =========================================
   EXPORTAR JSON
========================================= */

function exportData(){

    const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(deliveries));

    const downloadAnchorNode =
        document.createElement('a');

    downloadAnchorNode.setAttribute("href", dataStr);

    downloadAnchorNode.setAttribute(
        "download",
        "routify_entregas.json"
    );

    document.body.appendChild(downloadAnchorNode);

    downloadAnchorNode.click();

    downloadAnchorNode.remove();

}

/* =========================================
   AUTO REFRESH
========================================= */

setInterval(() => {

    console.log("Sistema Routify ativo");

}, 30000);

/* =========================================
   DARK MODE MAPA
========================================= */

console.log(`
=========================================
ROUTIFY
Sistema Inteligente de Entregas
=========================================
`);

