/* =========================================
ROUTIFY - SCRIPT COMPLETO
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

const deliveryList =
document.getElementById("deliveryList");

const totalDeliveries =
document.getElementById("totalDeliveries");

const groupedStreets =
document.getElementById("groupedStreets");

const routeRunningCount =
document.getElementById("routeRunningCount");

const completedRoutes =
document.getElementById("completedRoutes");

const progressFill =
document.getElementById("progressFill");

const progressPercent =
document.getElementById("progressPercent");

const loadRoutesBtn =
document.getElementById("loadRoutesBtn");

const optimizeBtn =
document.getElementById("optimizeBtn");

const startRouteBtn =
document.getElementById("startRouteBtn");

const stopRouteBtn =
document.getElementById("stopRouteBtn");

/* =========================================
DADOS
========================================= */

let importedRoutes = [];

let markers = [];

let groupedRoutes = {};

let currentRouteIndex = 0;

let routeInterval = null;

let currentMarker = null;

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
PROCESSAR DADOS
========================================= */

function processExcelData(data){

    importedRoutes = [];

    deliveryList.innerHTML = "";

    clearMarkers();

    data.forEach((row,index)=>{

        const item = {

            atId:
                row["AT ID"] || "",

            sequence:
                row["Sequence"] || "",

            stop:
                row["Stop"] || "",

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
                ) || 0,

            completed:false

        };

        importedRoutes.push(item);

        createDeliveryCard(item,index);

    });

    updateDashboard();

    showAlert(
        importedRoutes.length +
        " entregas importadas."
    );

}

/* =========================================
CRIAR CARD
========================================= */

function createDeliveryCard(route,index){

    const card =
    document.createElement("div");

    card.classList.add("delivery");

    card.id =
    "delivery-" + index;

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

        <div class="badge">
            📍 Stop:
            ${route.stop}
        </div>

        <button
            class="waze-btn"
            onclick="
                openWaze(
                    ${route.latitude},
                    ${route.longitude}
                )
            "
        >
            🚗 Abrir no Waze
        </button>

    `;

    deliveryList.appendChild(card);

}

/* =========================================
ATUALIZAR DASHBOARD
========================================= */

function updateDashboard(){

    totalDeliveries.innerHTML =
    importedRoutes.length;

    const groups = {};

    importedRoutes.forEach(route => {

        const key =
        route.bairro +
        "-" +
        route.zipcode;

        groups[key] = true;

    });

    groupedStreets.innerHTML =
    Object.keys(groups).length;

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

            const marker =
            L.marker([
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

                    <br>

                    <button
                        onclick="
                            openWaze(
                                ${route.latitude},
                                ${route.longitude}
                            )
                        "
                    >
                        🚗 Abrir no Waze
                    </button>

                </div>

            `);

            markers.push(marker);

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
        route.bairro +
        "-" +
        route.zipcode;

        if(!groupedRoutes[key]){

            groupedRoutes[key] = [];

        }

        groupedRoutes[key].push(route);

    });

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

                radius:18,

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

            markers.push(marker);

        }

    });

    showAlert(
        "Rotas agrupadas."
    );

}

/* =========================================
INICIAR ROTA
========================================= */

startRouteBtn.addEventListener(
    "click",
    startRoute
);

function startRoute(){

    if(importedRoutes.length === 0){

        showAlert(
            "Importe uma planilha."
        );

        return;

    }

    currentRouteIndex = 0;

    completedRoutes.innerHTML = 0;

    routeRunningCount.innerHTML =
    importedRoutes.length;

    runNextRoute();

}

/* =========================================
EXECUTAR ROTA
========================================= */

function runNextRoute(){

    if(
        currentRouteIndex >=
        importedRoutes.length
    ){

        showAlert(
            "Todas as entregas concluídas."
        );

        progressFill.style.width =
        "100%";

        progressPercent.innerHTML =
        "100%";

        return;

    }

    const route =
    importedRoutes[currentRouteIndex];

    if(currentMarker){

        map.removeLayer(currentMarker);

    }

    currentMarker =
    L.marker([
        route.latitude,
        route.longitude
    ],{
        draggable:false
    }).addTo(map);

    currentMarker.bindPopup(`

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

    `).openPopup();

    map.flyTo([
        route.latitude,
        route.longitude
    ],16,{
        animate:true,
        duration:2
    });

    highlightCard(currentRouteIndex);

    updateProgress();

    openWaze(
        route.latitude,
        route.longitude
    );

    route.completed = true;

    completedRoutes.innerHTML =
    currentRouteIndex + 1;

    currentRouteIndex++;

    routeInterval =
    setTimeout(
        runNextRoute,
        6000
    );

}

/* =========================================
PARAR ROTAS
========================================= */

stopRouteBtn.addEventListener(
    "click",
    stopRoutes
);

function stopRoutes(){

    clearTimeout(routeInterval);

    showAlert(
        "Rotas pausadas."
    );

}

/* =========================================
ATUALIZAR PROGRESSO
========================================= */

function updateProgress(){

    const progress =
    (
        currentRouteIndex /
        importedRoutes.length
    ) * 100;

    progressFill.style.width =
    progress + "%";

    progressPercent.innerHTML =
    Math.round(progress) + "%";

}

/* =========================================
DESTACAR CARD
========================================= */

function highlightCard(index){

    document
    .querySelectorAll(".delivery")
    .forEach(card => {

        card.style.border =
        "1px solid #334155";

    });

    const activeCard =
    document.getElementById(
        "delivery-" + index
    );

    if(activeCard){

        activeCard.style.border =
        "2px solid #22c55e";

        activeCard.scrollIntoView({
            behavior:"smooth",
            block:"center"
        });

    }

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
ABRIR WAZE
========================================= */

function openWaze(lat,lng){

    const url =
`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

    window.open(
        url,
        "_blank"
    );

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
LOCALIZAÇÃO
========================================= */

function locateUser(){

    if(navigator.geolocation){

        navigator.geolocation
        .getCurrentPosition(position => {

            const lat =
            position.coords.latitude;

            const lng =
            position.coords.longitude;

            const marker =
            L.circleMarker([lat,lng],{

                radius:10,

                color:"#22c55e",

                fillColor:"#22c55e",

                fillOpacity:1

            }).addTo(map);

            marker.bindPopup(
                "📍 Sua localização"
            );

        });

    }

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

            card.style.display =
            "block";

        }else{

            card.style.display =
            "none";

        }

    });

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

        csv +=
`${route.atId},
${route.sequence},
${route.stop},
${route.bairro},
${route.city},
${route.zipcode},
${route.latitude},
${route.longitude}\n`;

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

    alertBox.style.position =
    "fixed";

    alertBox.style.top =
    "20px";

    alertBox.style.right =
    "20px";

    alertBox.style.padding =
    "15px 20px";

    alertBox.style.background =
    "#2563eb";

    alertBox.style.color =
    "white";

    alertBox.style.borderRadius =
    "14px";

    alertBox.style.zIndex =
    "99999";

    alertBox.style.fontWeight =
    "600";

    alertBox.style.boxShadow =
    "0 10px 25px rgba(0,0,0,.25)";

    document.body.appendChild(
        alertBox
    );

    setTimeout(() => {

        alertBox.remove();

    },3000);

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
                "Atualizando..."
            );

        }

    }
);

/* =========================================
INICIALIZAÇÃO
========================================= */

console.log(`

=================================
ROUTIFY ONLINE
Sistema Inteligente de Entregas
=================================

`);

locateUser();
