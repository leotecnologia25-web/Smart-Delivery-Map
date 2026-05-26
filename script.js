/* =========================================
ROUTIFY PREMIUM - SCRIPT COMPLETO
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

const excelFile =
document.getElementById("excelFile");

const deliveryList =
document.getElementById("deliveryList");

const totalDeliveries =
document.getElementById("totalDeliveries");

const groupedStreets =
document.getElementById("groupedStreets");

const completedRoutes =
document.getElementById("completedRoutes");

const routeRunningCount =
document.getElementById("routeRunningCount");

const progressFill =
document.getElementById("progressFill");

const progressText =
document.getElementById("progressText");

const loadRoutesBtn =
document.getElementById("loadRoutesBtn");

const groupRoutesBtn =
document.getElementById("groupRoutesBtn");

const startRouteBtn =
document.getElementById("startRouteBtn");

const stopRouteBtn =
document.getElementById("stopRouteBtn");

/* =========================================
DADOS
========================================= */

let routes = [];

let groupedRoutes = {};

let markers = [];

let currentRouteIndex = 0;

let routeTimer = null;

let completed = 0;

let userMarker = null;

/* =========================================
UPLOAD EXCEL
========================================= */

excelFile.addEventListener(
    "change",
    handleExcelUpload
);

/* =========================================
LER EXCEL
========================================= */

function handleExcelUpload(event){

    const file =
    event.target.files[0];

    if(!file){

        showNotification(
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
PROCESSAR PLANILHA
========================================= */

function processExcelData(data){

    routes = [];

    clearMarkers();

    deliveryList.innerHTML = "";

    data.forEach((row,index)=>{

        const route = {

            id:index + 1,

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
            ) || 0,

            completed:false

        };

        routes.push(route);

    });

    updateDashboard();

    renderGroupedRoutes();

    showNotification(
        routes.length +
        " entregas importadas."
    );

}

/* =========================================
ATUALIZAR DASHBOARD
========================================= */

function updateDashboard(){

    totalDeliveries.innerHTML =
    routes.length;

    completedRoutes.innerHTML =
    completed;

}

/* =========================================
AGRUPAR RUAS
========================================= */

function createGroups(){

    groupedRoutes = {};

    routes.forEach(route => {

        const key =
        route.bairro +
        "-" +
        route.zipcode;

        if(!groupedRoutes[key]){

            groupedRoutes[key] = [];

        }

        groupedRoutes[key]
        .push(route);

    });

    groupedStreets.innerHTML =
    Object.keys(groupedRoutes).length;

}

/* =========================================
LISTAR ENTREGAS
========================================= */

function renderGroupedRoutes(){

    createGroups();

    deliveryList.innerHTML = "";

    let groupIndex = 0;

    Object.keys(groupedRoutes)
    .forEach(key => {

        const group =
        groupedRoutes[key];

        const card =
        document.createElement("div");

        card.classList.add("delivery");

        card.id =
        "delivery-" + groupIndex;

        card.innerHTML = `

            <h3>
                📍 ${group[0].bairro}
            </h3>

            <p>
                Cidade:
                ${group[0].city}
            </p>

            <p>
                CEP:
                ${group[0].zipcode}
            </p>

            <p>
                🚚 ${group.length}
                entregas agrupadas
            </p>

            <div class="badge">

                Rua Agrupada

            </div>

            <button
                class="waze-btn"
                onclick="
                    openWaze(
                        ${group[0].latitude},
                        ${group[0].longitude}
                    )
                "
            >

                🚗 Abrir no Waze

            </button>

        `;

        deliveryList.appendChild(card);

        groupIndex++;

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

    if(routes.length === 0){

        showNotification(
            "Importe uma planilha."
        );

        return;

    }

    routes.forEach(route => {

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

                <div style="width:220px">

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

                </div>

            `);

            markers.push(marker);

        }

    });

    focusMap();

    showNotification(
        "Rotas carregadas."
    );

}

/* =========================================
AGRUPAR ROTAS
========================================= */

groupRoutesBtn.addEventListener(
    "click",
    function(){

        renderGroupedRoutes();

        createGroupedMarkers();

        showNotification(
            "Rotas agrupadas."
        );

    }
);

/* =========================================
CRIAR MARCADORES AGRUPADOS
========================================= */

function createGroupedMarkers(){

    clearMarkers();

    Object.keys(groupedRoutes)
    .forEach(key => {

        const group =
        groupedRoutes[key];

        const lat =
        group[0].latitude;

        const lng =
        group[0].longitude;

        const marker =
        L.circleMarker([lat,lng],{

            radius:20,

            color:"#2563eb",

            fillColor:"#2563eb",

            fillOpacity:0.8,

            weight:2

        }).addTo(map);

        marker.bindPopup(`

            <div style="width:230px">

                <h3>
                    📦 ${group.length}
                    entregas
                </h3>

                <br>

                ${group.map(route => `

                    <p>
                        🚚 ${route.atId}
                    </p>

                `).join("")}

            </div>

        `);

        markers.push(marker);

    });

}

/* =========================================
INICIAR ROTAS
========================================= */

startRouteBtn.addEventListener(
    "click",
    startRoutes
);

function startRoutes(){

    if(routes.length === 0){

        showNotification(
            "Importe as rotas."
        );

        return;

    }

    currentRouteIndex = 0;

    completed = 0;

    completedRoutes.innerHTML = 0;

    routeRunningCount.innerHTML =
    routes.length;

    executeNextRoute();

}

/* =========================================
EXECUTAR ROTAS
========================================= */

function executeNextRoute(){

    if(
        currentRouteIndex >=
        routes.length
    ){

        progressFill.style.width =
        "100%";

        progressText.innerHTML =
        "100%";

        showNotification(
            "Todas entregas concluídas."
        );

        return;

    }

    const route =
    routes[currentRouteIndex];

    highlightDelivery(
        currentRouteIndex
    );

    map.flyTo([
        route.latitude,
        route.longitude
    ],17);

    openWaze(
        route.latitude,
        route.longitude
    );

    completed++;

    completedRoutes.innerHTML =
    completed;

    const progress =
    (
        completed /
        routes.length
    ) * 100;

    progressFill.style.width =
    progress + "%";

    progressText.innerHTML =
    Math.round(progress) + "%";

    currentRouteIndex++;

    routeTimer =
    setTimeout(
        executeNextRoute,
        5000
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

    clearTimeout(routeTimer);

    showNotification(
        "Rotas pausadas."
    );

}

/* =========================================
DESTACAR ENTREGA
========================================= */

function highlightDelivery(index){

    document
    .querySelectorAll(".delivery")
    .forEach(card => {

        card.classList.remove(
            "active"
        );

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
LOCALIZAÇÃO TEMPO REAL
========================================= */

function trackUserLocation(){

    if(
        navigator.geolocation
    ){

        navigator.geolocation.watchPosition(
            position => {

                const lat =
                position.coords.latitude;

                const lng =
                position.coords.longitude;

                if(userMarker){

                    userMarker.setLatLng([
                        lat,
                        lng
                    ]);

                }else{

                    userMarker =
                    L.marker([lat,lng],{

                        title:
                        "Sua localização"

                    }).addTo(map);

                }

            },
            error => {

                console.log(
                    error
                );

            },
            {
                enableHighAccuracy:true,
                maximumAge:0,
                timeout:5000
            }
        );

    }

}

/* =========================================
FOCAR MAPA
========================================= */

function focusMap(){

    const bounds = [];

    routes.forEach(route => {

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
LIMPAR MARCADORES
========================================= */

function clearMarkers(){

    markers.forEach(marker => {

        map.removeLayer(marker);

    });

    markers = [];

}

/* =========================================
NOTIFICAÇÃO
========================================= */

function showNotification(message){

    const notification =
    document.createElement("div");

    notification.innerHTML =
    message;

    notification.style.position =
    "fixed";

    notification.style.top =
    "20px";

    notification.style.right =
    "20px";

    notification.style.background =
    "#2563eb";

    notification.style.color =
    "#fff";

    notification.style.padding =
    "15px 20px";

    notification.style.borderRadius =
    "14px";

    notification.style.zIndex =
    "99999";

    notification.style.fontWeight =
    "700";

    notification.style.boxShadow =
    "0 10px 30px rgba(0,0,0,.25)";

    document.body.appendChild(
        notification
    );

    setTimeout(()=>{

        notification.remove();

    },3000);

}

/* =========================================
BUSCA
========================================= */

function searchDeliveries(term){

    const cards =
    document.querySelectorAll(
        ".delivery"
    );

    cards.forEach(card => {

        const text =
        card.innerText
        .toLowerCase();

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
        routes,
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
    "routify_rotas.json";

    a.click();

}

/* =========================================
EXPORTAR CSV
========================================= */

function exportCSV(){

    let csv =
`AT ID,Sequence,Stop,Bairro,City,CEP,Latitude,Longitude\n`;

    routes.forEach(route => {

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
ATALHOS
========================================= */

document.addEventListener(
    "keydown",
    function(e){

        if(
            e.ctrlKey &&
            e.key === "s"
        ){

            e.preventDefault();

            exportJSON();

        }

    }
);

/* =========================================
INICIAR
========================================= */

trackUserLocation();

console.log(`

=========================================
ROUTIFY PREMIUM
Sistema Inteligente de Entregas
=========================================

`);
