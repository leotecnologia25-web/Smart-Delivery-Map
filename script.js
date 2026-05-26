/* =========================================
ROUTIFY PREMIUM
SCRIPT.JS COMPLETO
========================================= */

/* =========================================
MAPA GLOBAL
========================================= */

let map;

/* =========================================
DADOS
========================================= */

let importedRoutes = [];

let routeMarkers = [];

let groupedRoutes = {};

let routeStarted = false;

let currentRouteIndex = 0;

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

const progressFill =
document.getElementById("progressFill");

const progressText =
document.getElementById("progressText");

const searchInput =
document.getElementById("searchInput");

const loadRoutesBtn =
document.getElementById("loadRoutesBtn");

const groupRoutesBtn =
document.getElementById("groupRoutesBtn");

const startRouteBtn =
document.getElementById("startRouteBtn");

const stopRouteBtn =
document.getElementById("stopRouteBtn");

/* =========================================
INICIALIZAR MAPA
========================================= */

function initMap(){

    if(map){

        map.remove();

    }

    map = L.map('map',{

        zoomControl:true

    }).setView(

        [-2.5307,-44.3068],
        12

    );

    L.tileLayer(

        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

        {

            attribution:
            '&copy; OpenStreetMap contributors',

            maxZoom:19

        }

    ).addTo(map);

    setTimeout(()=>{

        map.invalidateSize();

    },200);

}

/* =========================================
UPLOAD EXCEL
========================================= */

excelInput.addEventListener(

    "change",

    handleExcelUpload

);

/* =========================================
LER PLANILHA
========================================= */

function handleExcelUpload(event){

    const file =
    event.target.files[0];

    if(!file){

        showAlert(
            "Selecione uma planilha."
        );

        return;

    }

    const reader =
    new FileReader();

    reader.onload = function(e){

        const data =
        new Uint8Array(
            e.target.result
        );

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

    clearMarkers();

    data.forEach(row=>{

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
            ) || 0

        };

        importedRoutes.push(item);

    });

    sortRoutesAlphabetically();

    updateDashboard();

    renderDeliveryList();

    showAlert(

        importedRoutes.length +
        " entregas carregadas."

    );

}

/* =========================================
ORDENAR BAIRROS
========================================= */

function sortRoutesAlphabetically(){

    importedRoutes.sort((a,b)=>{

        return a.bairro.localeCompare(
            b.bairro
        );

    });

}

/* =========================================
ATUALIZAR DASHBOARD
========================================= */

function updateDashboard(){

    totalDeliveries.innerHTML =
    importedRoutes.length;

    const bairros = {};

    importedRoutes.forEach(route=>{

        bairros[
            normalizeText(
                route.bairro
            )
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
            ">

                🗺 Abrir no Waze

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

    importedRoutes.forEach(route=>{

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
                        CEP:
                        ${route.zipcode}
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
AGRUPAR BAIRROS
========================================= */

groupRoutesBtn.addEventListener(

    "click",

    groupRoutes

);

function groupRoutes(){

    groupedRoutes = {};

    importedRoutes.forEach(route=>{

        const bairro =
        normalizeText(
            route.bairro
        );

        if(!groupedRoutes[bairro]){

            groupedRoutes[bairro] = [];

        }

        groupedRoutes[bairro]
        .push(route);

    });

    Object.keys(groupedRoutes)
    .forEach(key=>{

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

                fillOpacity:0.8

            }).addTo(map);

            marker.bindPopup(`

                <h3>
                    ${routes.length}
                    entregas
                </h3>

                <p>
                    Bairro:
                    ${routes[0].bairro}
                </p>

            `);

            routeMarkers.push(marker);

        }

    });

    showAlert(
        "Bairros agrupados."
    );

}

/* =========================================
INICIAR ROTA
========================================= */

startRouteBtn.addEventListener(

    "click",

    startRoutes

);

function startRoutes(){

    if(importedRoutes.length === 0){

        showAlert(
            "Importe uma planilha."
        );

        return;

    }

    routeStarted = true;

    currentRouteIndex = 0;

    inRoute.innerHTML =
    importedRoutes.length;

    completedRoutes.innerHTML = 0;

    nextRoute();

}

/* =========================================
PRÓXIMA ENTREGA
========================================= */

function nextRoute(){

    if(!routeStarted){

        return;

    }

    if(
        currentRouteIndex >=
        importedRoutes.length
    ){

        showAlert(
            "Rotas finalizadas."
        );

        return;

    }

    const route =
    importedRoutes[currentRouteIndex];

    map.setView([
        route.latitude,
        route.longitude
    ],16);

    document
    .querySelectorAll(".delivery")
    .forEach(card=>{

        card.classList.remove(
            "active"
        );

    });

    const activeCard =
    document.getElementById(
        "delivery-" +
        currentRouteIndex
    );

    if(activeCard){

        activeCard.classList.add(
            "active"
        );

    }

    openWaze(
        route.latitude,
        route.longitude
    );

    currentRouteIndex++;

    completedRoutes.innerHTML =
    currentRouteIndex;

    inRoute.innerHTML =
    importedRoutes.length -
    currentRouteIndex;

    updateProgress();

    setTimeout(()=>{

        nextRoute();

    },10000);

}

/* =========================================
PARAR ROTAS
========================================= */

stopRouteBtn.addEventListener(

    "click",

    stopRoutes

);

function stopRoutes(){

    routeStarted = false;

    showAlert(
        "Rotas pausadas."
    );

}

/* =========================================
PROGRESSO
========================================= */

function updateProgress(){

    const percent =

    (
        currentRouteIndex /
        importedRoutes.length
    ) * 100;

    progressFill.style.width =
    percent + "%";

    progressText.innerHTML =

    Math.floor(percent) + "%";

}

/* =========================================
ABRIR WAZE
========================================= */

function openWaze(lat,lng){

    window.open(

        `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,

        "_blank"

    );

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

        cards.forEach(card=>{

            const text =
            card.innerText
            .toLowerCase();

            card.style.display =

            text.includes(term)

            ? "block"

            : "none";

        });

    }

);

/* =========================================
LOCALIZAÇÃO
========================================= */

function locateUser(){

    if(navigator.geolocation){

        navigator.geolocation
        .getCurrentPosition(position=>{

            const lat =
            position.coords.latitude;

            const lng =
            position.coords.longitude;

            map.setView([lat,lng],15);

            L.marker([lat,lng])
            .addTo(map)
            .bindPopup(
                "Sua localização"
            )
            .openPopup();

        });

    }

}

/* =========================================
FOCAR ROTAS
========================================= */

function focusRoutes(){

    const bounds = [];

    importedRoutes.forEach(route=>{

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

    routeMarkers.forEach(marker=>{

        map.removeLayer(marker);

    });

    routeMarkers = [];

}

/* =========================================
NORMALIZAR TEXTO
========================================= */

function normalizeText(text){

    return text

    .toLowerCase()

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g,"")

    .replace(/\s+/g," ")

    .trim();

}

/* =========================================
ALERTAS
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

    document.body
    .appendChild(alertBox);

    setTimeout(()=>{

        alertBox.remove();

    },3000);

}

/* =========================================
INICIAR SISTEMA
========================================= */

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        initMap();

        locateUser();

    }

);
