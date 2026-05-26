/* =========================================
ROUTIFY PREMIUM
SCRIPT.JS COMPLETO
AGRUPAMENTO POR BAIRRO
ROTA EM TEMPO REAL
WAZE
IMPORTAÇÃO EXCEL
========================================= */

/* =========================================
MAPA
========================================= */

const map = L.map('map',{
    zoomControl:true
}).setView([-2.5307,-44.3068],12);

/* =========================================
CAMADA MAPA
========================================= */

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
    attribution:'© OpenStreetMap'
}).addTo(map);

/* =========================================
ELEMENTOS
========================================= */

const excelInput =
document.getElementById("excelFile");

const totalDeliveries =
document.getElementById("totalDeliveries");

const groupedStreets =
document.getElementById("groupedStreets");

const inRoute =
document.getElementById("inRoute");

const completedRoutes =
document.getElementById("completedRoutes");

const deliveryList =
document.getElementById("deliveryList");

const loadRoutesBtn =
document.getElementById("loadRoutesBtn");

const groupRoutesBtn =
document.getElementById("groupRoutesBtn");

const startRouteBtn =
document.getElementById("startRouteBtn");

const stopRouteBtn =
document.getElementById("stopRouteBtn");

const progressFill =
document.getElementById("progressFill");

const progressText =
document.getElementById("progressText");

/* =========================================
DADOS
========================================= */

let importedRoutes = [];

let routeMarkers = [];

let groupedRoutes = {};

let currentRouteIndex = 0;

let routeRunning = false;

let routeInterval = null;

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
            "Selecione uma planilha."
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
PROCESSAR EXCEL
========================================= */

function processExcelData(data){

    importedRoutes = [];

    deliveryList.innerHTML = "";

    clearMarkers();

    data.forEach((row,index)=>{

        const item = {

            atId:
                row["AT ID"] || "Sem ID",

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

    });

    updateDashboard();

    renderDeliveryList();

    showAlert(
        importedRoutes.length +
        " entregas importadas."
    );

}

/* =========================================
LISTA ENTREGAS
========================================= */

function renderDeliveryList(){

    deliveryList.innerHTML = "";

    importedRoutes.forEach((route,index)=>{

        const card =
        document.createElement("div");

        card.className = "delivery";

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
                onclick="openWaze(
                    ${route.latitude},
                    ${route.longitude}
                )"
            >
                📍 Abrir no Waze
            </button>

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

                <div>

                    <h3>
                        🚚 ${route.atId}
                    </h3>

                    <p>
                        ${route.bairro}
                    </p>

                    <p>
                        ${route.city}
                    </p>

                </div>

            `);

            routeMarkers.push(marker);

        }

    });

    focusRoutes();

    showAlert(
        "Rotas carregadas."
    );

}

/* =========================================
NORMALIZAR BAIRRO
========================================= */

function normalizeBairro(text){

    if(!text) return "";

    return text
    .toLowerCase()

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g,"")

    .replace(/\./g,"")

    .replace(/\s+/g," ")

    .trim();

}

/* =========================================
AGRUPAR BAIRROS
========================================= */

groupRoutesBtn.addEventListener(
    "click",
    groupRoutesByBairro
);

function groupRoutesByBairro(){

    clearMarkers();

    groupedRoutes = {};

    importedRoutes.forEach(route => {

        const bairro =
        normalizeBairro(
            route.bairro
        );

        if(!bairro) return;

        if(!groupedRoutes[bairro]){

            groupedRoutes[bairro] = [];

        }

        groupedRoutes[bairro].push(route);

    });

    createBairroMarkers();

}

/* =========================================
CRIAR MARCADORES BAIRRO
========================================= */

function createBairroMarkers(){

    Object.keys(groupedRoutes)
    .forEach(bairro => {

        const routes =
        groupedRoutes[bairro];

        if(routes.length === 0) return;

        const lat =
        routes[0].latitude;

        const lng =
        routes[0].longitude;

        const marker =
        L.circleMarker([lat,lng],{

            radius:25,

            color:"#2563eb",

            fillColor:"#2563eb",

            fillOpacity:0.85,

            weight:2

        }).addTo(map);

        marker.bindPopup(`

            <div style="width:260px">

                <h3>
                    📍 ${bairro.toUpperCase()}
                </h3>

                <br>

                <b>
                    🚚 ${routes.length}
                    entregas
                </b>

                <hr>

                ${routes.map(route => `

                    <p>
                        📦 ${route.atId}
                    </p>

                `).join("")}

            </div>

        `);

        routeMarkers.push(marker);

    });

    groupedStreets.innerHTML =
    Object.keys(groupedRoutes).length;

    showAlert(
        "Bairros agrupados."
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

    if(routeRunning){

        showAlert(
            "Rota já iniciada."
        );

        return;

    }

    routeRunning = true;

    currentRouteIndex = 0;

    inRoute.innerHTML =
    importedRoutes.length;

    routeInterval = setInterval(()=>{

        if(
            currentRouteIndex >=
            importedRoutes.length
        ){

            clearInterval(routeInterval);

            routeRunning = false;

            showAlert(
                "Rota finalizada."
            );

            return;

        }

        updateCurrentRoute(
            currentRouteIndex
        );

        currentRouteIndex++;

    },3000);

}

/* =========================================
ATUALIZAR ROTA
========================================= */

function updateCurrentRoute(index){

    const route =
    importedRoutes[index];

    if(
        route.latitude &&
        route.longitude
    ){

        map.setView([
            route.latitude,
            route.longitude
        ],16);

        const marker =
        L.marker([
            route.latitude,
            route.longitude
        ]).addTo(map);

        marker.bindPopup(
            "🚚 Entrega Atual"
        ).openPopup();

        routeMarkers.push(marker);

    }

    const cards =
    document.querySelectorAll(".delivery");

    cards.forEach(card => {

        card.classList.remove("active");

    });

    const activeCard =
    document.getElementById(
        "delivery-" + index
    );

    if(activeCard){

        activeCard.classList.add(
            "active"
        );

        activeCard.scrollIntoView({
            behavior:"smooth",
            block:"center"
        });

    }

    importedRoutes[index]
    .completed = true;

    completedRoutes.innerHTML =
    importedRoutes.filter(
        r => r.completed
    ).length;

    const percent =
    Math.floor(
        (
            completedRoutes.innerHTML /
            importedRoutes.length
        ) * 100
    );

    progressFill.style.width =
    percent + "%";

    progressText.innerHTML =
    percent + "%";

}

/* =========================================
ENCERRAR ROTA
========================================= */

stopRouteBtn.addEventListener(
    "click",
    stopRoute
);

function stopRoute(){

    clearInterval(routeInterval);

    routeRunning = false;

    showAlert(
        "Rota encerrada."
    );

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
ATUALIZAR DASHBOARD
========================================= */

function updateDashboard(){

    totalDeliveries.innerHTML =
    importedRoutes.length;

}

/* =========================================
ABRIR WAZE
========================================= */

function openWaze(lat,lng){

    const url =
    `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

    window.open(url,"_blank");

}

/* =========================================
ALERTA
========================================= */

function showAlert(message){

    const alert =
    document.createElement("div");

    alert.innerHTML = message;

    alert.style.position = "fixed";
    alert.style.top = "20px";
    alert.style.right = "20px";
    alert.style.padding = "14px 18px";
    alert.style.background = "#2563eb";
    alert.style.color = "#fff";
    alert.style.borderRadius = "14px";
    alert.style.zIndex = "99999";
    alert.style.fontWeight = "700";
    alert.style.boxShadow =
    "0 10px 25px rgba(0,0,0,.25)";

    document.body.appendChild(alert);

    setTimeout(()=>{

        alert.remove();

    },3000);

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

            L.marker([lat,lng])
            .addTo(map)
            .bindPopup(
                "📍 Sua localização"
            );

        });

    }

}

locateUser();

/* =========================================
ONLINE
========================================= */

console.log(`

=================================
ROUTIFY PREMIUM ONLINE
=================================

`);
