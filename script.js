/* =========================================
ROUTIFY - SISTEMA COMPLETO
========================================= */

/* =========================================
MAPA
========================================= */

const map = L.map('map', {
    zoomControl: true
}).setView([-2.5307, -44.3068], 12);

/* =========================================
CAMADA MAPA
========================================= */

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

/* =========================================
ELEMENTOS
========================================= */

const excelInput =
document.getElementById("excelFile");

const tableBody =
document.querySelector("#excelTable tbody");

const totalDeliveries =
document.getElementById("totalDeliveries");

const groupedStreets =
document.getElementById("groupedStreets");

const loadRoutesBtn =
document.getElementById("loadRoutesBtn");

const optimizeBtn =
document.getElementById("optimizeBtn");

const deliveryList =
document.getElementById("deliveryList");

/* =========================================
DADOS
========================================= */

let importedRoutes = [];

let routeMarkers = [];

let groupedRoutes = {};

/* =========================================
UPLOAD EXCEL
========================================= */

excelInput.addEventListener(
    "change",
    handleExcelUpload
);

/* =========================================
LER EXCEL
========================================= */

function handleExcelUpload(event){

    const file = event.target.files[0];

    if(!file){

        showAlert(
            "Selecione uma planilha Excel."
        );

        return;

    }

    const reader = new FileReader();

    reader.onload = function(e){

        const data =
        new Uint8Array(e.target.result);

        const workbook =
        XLSX.read(data,{
            type:'array'
        });

        const sheetName =
        workbook.SheetNames[0];

        const sheet =
        workbook.Sheets[sheetName];

        const json =
        XLSX.utils.sheet_to_json(sheet);

        processExcelData(json);

    };

    reader.readAsArrayBuffer(file);

}

/* =========================================
PROCESSAR PLANILHA
========================================= */

function processExcelData(data){

    importedRoutes = [];

    tableBody.innerHTML = "";

    clearMarkers();

    data.forEach((row,index)=>{

        const item = {

            atId:
                row["AT ID"] || "",

            sequence:
                row["Sequence"] || "",

            stop:
                row["Stop"] || "",

            spx:
                row["SPX TN"] || "",

            bairro:
                row["Bairro"] || "",

            city:
                row["City"] || "",

            zipcode:
                row["Zipcode/Postal code"] || "",

            latitude:
                parseFloat(
                    row["Latitude"]
                ) || 0,

            longitude:
                parseFloat(
                    row["Longitude"]
                ) || 0

        };

        importedRoutes.push(item);

        createTableRow(item);

    });

    updateDashboard();

    renderDeliveryList();

    showAlert(
        importedRoutes.length +
        " entregas importadas."
    );

}

/* =========================================
CRIAR TABELA
========================================= */

function createTableRow(item){

    const tr =
    document.createElement("tr");

    tr.innerHTML = `

        <td>${item.atId}</td>
        <td>${item.sequence}</td>
        <td>${item.stop}</td>
        <td>${item.spx}</td>
        <td>${item.bairro}</td>
        <td>${item.city}</td>
        <td>${item.zipcode}</td>
        <td>${item.latitude}</td>
        <td>${item.longitude}</td>

    `;

    tableBody.appendChild(tr);

}

/* =========================================
ATUALIZAR DASHBOARD
========================================= */

function updateDashboard(){

    totalDeliveries.innerHTML =
    importedRoutes.length;

    const streets = {};

    importedRoutes.forEach(route => {

        const key =
        route.bairro + "-" +
        route.zipcode;

        streets[key] = true;

    });

    groupedStreets.innerHTML =
    Object.keys(streets).length;

}

/* =========================================
LISTA ENTREGAS
========================================= */

function renderDeliveryList(){

    deliveryList.innerHTML = "";

    importedRoutes.forEach(route => {

        const card =
        document.createElement("div");

        card.classList.add("delivery");

        card.innerHTML = `

            <h3>
                🚚 ${route.atId}
            </h3>

            <p>
                Bairro:
                ${route.bairro}
            </p>

            <p>
                Cidade:
                ${route.city}
            </p>

            <p>
                CEP:
                ${route.zipcode}
            </p>

            <div class="street-badge">

                📍 Stop:
                ${route.stop}

            </div>

        `;

        deliveryList.appendChild(card);

    });

}

/* =========================================
CARREGAR ROTAS
========================================= */

loadRoutesBtn.addEventListener(
    "click",
    loadRoutes
);

function loadRoutes(){

    clearMarkers();

    if(importedRoutes.length === 0){

        showAlert(
            "Importe uma planilha primeiro."
        );

        return;

    }

    importedRoutes.forEach(route => {

        if(
            route.latitude &&
            route.longitude
        ){

            const marker = L.marker([
                route.latitude,
                route.longitude
            ]).addTo(map);

            marker.bindPopup(`

                <div style="width:230px">

                    <h3>
                        🚚 ${route.atId}
                    </h3>

                    <br>

                    <p>
                        Bairro:
                        ${route.bairro}
                    </p>

                    <p>
                        Cidade:
                        ${route.city}
                    </p>

                    <p>
                        CEP:
                        ${route.zipcode}
                    </p>

                    <p>
                        Stop:
                        ${route.stop}
                    </p>

                    <p>
                        Sequence:
                        ${route.sequence}
                    </p>

                </div>

            `);

            routeMarkers.push(marker);

        }

    });

    focusRoutes();

    showAlert(
        "Rotas carregadas no mapa."
    );

}

/* =========================================
AGRUPAR ROTAS
========================================= */

optimizeBtn.addEventListener(
    "click",
    groupRoutes
);

function groupRoutes(){

    groupedRoutes = {};

    importedRoutes.forEach(route => {

        const key =
        route.bairro + "-" +
        route.zipcode;

        if(!groupedRoutes[key]){

            groupedRoutes[key] = [];

        }

        groupedRoutes[key].push(route);

    });

    createGroupedMarkers();

    showAlert(
        "Rotas agrupadas."
    );

}

/* =========================================
CRIAR AGRUPAMENTOS
========================================= */

function createGroupedMarkers(){

    Object.keys(groupedRoutes)
    .forEach(key => {

        const routes =
        groupedRoutes[key];

        if(routes.length > 1){

            const lat =
            routes[0].latitude;

            const lng =
            routes[0].longitude;

            const marker =
            L.circleMarker([lat,lng],{

                radius:20,

                color:"#2563eb",

                fillColor:"#2563eb",

                fillOpacity:0.8,

                weight:2

            }).addTo(map);

            marker.bindPopup(`

                <div style="width:250px">

                    <h3>
                        📍
                        ${routes.length}
                        entregas agrupadas
                    </h3>

                    <br>

                    ${routes.map(route => `

                        <p>
                            🚚 ${route.atId}
                        </p>

                    `).join("")}

                </div>

            `);

            routeMarkers.push(marker);

        }

    });

}

/* =========================================
FOCAR ROTAS
========================================= */

function focusRoutes(){

    const bounds = [];

    importedRoutes.forEach(route => {

        if(
            route.latitude &&
            route.longitude
        ){

            bounds.push([
                route.latitude,
                route.longitude
            ]);

        }

    });

    if(bounds.length > 0){

        map.fitBounds(bounds);

    }

}

/* =========================================
LIMPAR MARKERS
========================================= */

function clearMarkers(){

    routeMarkers.forEach(marker => {

        map.removeLayer(marker);

    });

    routeMarkers = [];

}

/* =========================================
BUSCA
========================================= */

function searchRoutes(term){

    const cards =
    document.querySelectorAll(".delivery");

    cards.forEach(card => {

        const text =
        card.innerText.toLowerCase();

        if(
            text.includes(
                term.toLowerCase()
            )
        ){

            card.style.display = "block";

        }else{

            card.style.display = "none";

        }

    });

}

/* =========================================
LOCALIZAÇÃO USUÁRIO
========================================= */

function locateUser(){

    if(navigator.geolocation){

        navigator.geolocation
        .getCurrentPosition(position => {

            const lat =
            position.coords.latitude;

            const lng =
            position.coords.longitude;

            map.setView([lat,lng],15);

            const marker =
            L.marker([lat,lng])
            .addTo(map);

            marker.bindPopup(
                "Sua localização"
            ).openPopup();

        });

    }

}

/* =========================================
EXPORTAR JSON
========================================= */

function exportJSON(){

    const data =
    JSON.stringify(
        importedRoutes,
        null,
        2
    );

    const blob =
    new Blob([data],{
        type:'application/json'
    });

    const url =
    URL.createObjectURL(blob);

    const a =
    document.createElement("a");

    a.href = url;

    a.download =
    "routify_entregas.json";

    a.click();

}

/* =========================================
EXPORTAR CSV
========================================= */

function exportCSV(){

    let csv =
    "AT ID,Sequence,Stop,Bairro,City,CEP,Latitude,Longitude\n";

    importedRoutes.forEach(route => {

        csv += `
${route.atId},
${route.sequence},
${route.stop},
${route.bairro},
${route.city},
${route.zipcode},
${route.latitude},
${route.longitude}
`;

    });

    const blob =
    new Blob([csv],{
        type:'text/csv'
    });

    const url =
    URL.createObjectURL(blob);

    const a =
    document.createElement("a");

    a.href = url;

    a.download =
    "routify.csv";

    a.click();

}

/* =========================================
ALERTA
========================================= */

function showAlert(message){

    const alertBox =
    document.createElement("div");

    alertBox.innerHTML = message;

    alertBox.style.position = "fixed";
    alertBox.style.top = "20px";
    alertBox.style.right = "20px";
    alertBox.style.padding = "15px 20px";
    alertBox.style.background = "#2563eb";
    alertBox.style.color = "white";
    alertBox.style.borderRadius = "14px";
    alertBox.style.zIndex = "99999";
    alertBox.style.fontWeight = "600";
    alertBox.style.boxShadow =
    "0 10px 25px rgba(0,0,0,.25)";

    document.body.appendChild(alertBox);

    setTimeout(() => {

        alertBox.remove();

    }, 3000);

}

/* =========================================
AUTO REFRESH
========================================= */

setInterval(()=>{

    console.log(
        "Routify Online"
    );

},30000);

/* =========================================
ATALHOS
========================================= */

document.addEventListener(
    "keydown",
    function(e){

        if(e.key === "F5"){

            console.log(
                "Atualizando sistema..."
            );

        }

    }
);

/* =========================================
INICIALIZAÇÃO
========================================= */

console.log(`

=========================================
ROUTIFY
Sistema Inteligente de Entregas
=========================================

`);

locateUser();
