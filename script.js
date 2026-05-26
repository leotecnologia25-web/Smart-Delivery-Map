/* =========================================
ROUTIFY PREMIUM
SCRIPT.JS COMPLETO
AGRUPAMENTO INTELIGENTE DE BAIRROS
========================================= */

/* =========================================
MAPA
========================================= */

const map = L.map('map',{
    zoomControl:true
}).setView([-2.5307,-44.3068],12);

/* =========================================
TEMA MAPA
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

const searchInput =
document.getElementById("searchInput");

/* =========================================
DADOS
========================================= */

let importedRoutes = [];

let groupedRoutes = {};

let routeMarkers = [];

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
                row["AT ID"] || "SEM ID",

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

    sortRoutesAlphabetically();

    updateDashboard();

    renderDeliveryList();

    showAlert(
        importedRoutes.length +
        " entregas importadas."
    );

}

/* =========================================
ORDENAR ALFABÉTICO
========================================= */

function sortRoutesAlphabetically(){

    importedRoutes.sort((a,b)=>{

        const bairroA =
        (a.bairro || "")
        .toLowerCase();

        const bairroB =
        (b.bairro || "")
        .toLowerCase();

        if(bairroA < bairroB) return -1;
        if(bairroA > bairroB) return 1;

        return 0;

    });

}

/* =========================================
ATUALIZAR DASHBOARD
========================================= */

function updateDashboard(){

    totalDeliveries.innerHTML =
    importedRoutes.length;

    const bairros = {};

    importedRoutes.forEach(route => {

        bairros[
            route.bairro
        ] = true;

    });

    groupedStreets.innerHTML =
    Object.keys(bairros).length;

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
                📍 Bairro:
                ${route.bairro}
            </p>

            <p>
                🏙 Cidade:
                ${route.city}
            </p>

            <p>
                📦 Stop:
                ${route.stop}
            </p>

            <p>
                📮 CEP:
                ${route.zipcode}
            </p>

            <button
                class="waze-btn"
                onclick="
                openWaze(
                    ${route.latitude},
                    ${route.longitude}
                )"
            >
                📍 Abrir Waze
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
                        Bairro:
                        ${route.bairro}
                    </p>

                    <p>
                        Cidade:
                        ${route.city}
                    </p>

                    <p>
                        Stop:
                        ${route.stop}
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
NORMALIZAR TEXTO
========================================= */

function normalizeText(text){

    if(!text) return "";

    return text
    .toLowerCase()

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g,"")

    .replace(/[^a-z0-9\s]/g,"")

    .replace(/\s+/g," ")

    .trim();

}

/* =========================================
VERIFICAR BAIRROS PARECIDOS
========================================= */

function isSimilarBairro(a,b){

    a = normalizeText(a);
    b = normalizeText(b);

    if(a === b){
        return true;
    }

    if(a.includes(b)){
        return true;
    }

    if(b.includes(a)){
        return true;
    }

    const firstA =
    a.split(" ")[0];

    const firstB =
    b.split(" ")[0];

    if(firstA === firstB){
        return true;
    }

    return false;

}

/* =========================================
AGRUPAR BAIRROS PARECIDOS
========================================= */

groupRoutesBtn.addEventListener(
    "click",
    groupRoutesBySimilarBairro
);

function groupRoutesBySimilarBairro(){

    clearMarkers();

    groupedRoutes = {};

    importedRoutes.forEach(route => {

        let matchedGroup = null;

        Object.keys(groupedRoutes)
        .forEach(groupName => {

            if(
                isSimilarBairro(
                    route.bairro,
                    groupName
                )
            ){

                matchedGroup =
                groupName;

            }

        });

        if(matchedGroup){

            groupedRoutes[
                matchedGroup
            ].push(route);

        }
        else{

            groupedRoutes[
                route.bairro
            ] = [route];

        }

    });

    createGroupedMarkers();

    showAlert(
        "Bairros semelhantes agrupados."
    );

}

/* =========================================
CRIAR AGRUPAMENTOS
========================================= */

function createGroupedMarkers(){

    Object.keys(groupedRoutes)
    .forEach(group => {

        const routes =
        groupedRoutes[group];

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

            <div style="width:250px">

                <h3>
                    📍 ${group.toUpperCase()}
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
ATUALIZAR ENTREGA
========================================= */

function updateCurrentRoute(index){

    const route =
    importedRoutes[index];

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
PARAR ROTA
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
LIMPAR MAPA
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

searchInput.addEventListener(
    "keyup",
    function(){

        const term =
        this.value.toLowerCase();

        const cards =
        document.querySelectorAll(
            ".delivery"
        );

        cards.forEach(card => {

            const text =
            card.innerText.toLowerCase();

            if(text.includes(term)){

                card.style.display =
                "block";

            }
            else{

                card.style.display =
                "none";

            }

        });

    }
);

/* =========================================
WAZE
========================================= */

function openWaze(lat,lng){

    const url =
    `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

    window.open(url,"_blank");

}

/* =========================================
ALERTAS
========================================= */

function showAlert(message){

    const alert =
    document.createElement("div");

    alert.innerHTML = message;

    alert.style.position =
    "fixed";

    alert.style.top =
    "20px";

    alert.style.right =
    "20px";

    alert.style.padding =
    "14px 18px";

    alert.style.background =
    "#2563eb";

    alert.style.color =
    "#fff";

    alert.style.borderRadius =
    "14px";

    alert.style.zIndex =
    "99999";

    alert.style.fontWeight =
    "700";

    document.body.appendChild(
        alert
    );

    setTimeout(()=>{

        alert.remove();

    },3000);

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

            L.marker([lat,lng])
            .addTo(map)

            .bindPopup(
                "📍 Sua localização"
            );

        });

    }

}

/* =========================================
INICIAR SISTEMA
========================================= */

locateUser();

console.log(`

=========================================
ROUTIFY PREMIUM ONLINE
=========================================

`);
