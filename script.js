/* =========================================
ROUTIFY - SCRIPT.JS CORRIGIDO
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
ROTA TEMPO REAL
========================================= */

const startRouteBtn =
document.getElementById("startRouteBtn");

const pauseRouteBtn =
document.getElementById("pauseRouteBtn");

const stopRouteBtn =
document.getElementById("stopRouteBtn");

const routeStatusText =
document.getElementById("routeStatusText");

const progressFill =
document.getElementById("progressFill");

const progressPercent =
document.getElementById("progressPercent");

const nextDelivery =
document.getElementById("nextDelivery");

const currentDistrict =
document.getElementById("currentDistrict");

const estimatedTime =
document.getElementById("estimatedTime");

const routeIndicator =
document.getElementById("routeIndicator");

/* =========================================
DADOS
========================================= */

let importedRoutes = [];

let routeMarkers = [];

let groupedRoutes = {};

let currentRouteIndex = 0;

let routeRunning = false;

let routePaused = false;

let routeTimeout = null;

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

        try{

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

        }catch(error){

            console.error(error);

            showAlert(
                "Erro ao importar planilha."
            );

        }

    };

    reader.readAsArrayBuffer(file);

}

/* =========================================
PROCESSAR PLANILHA
========================================= */

function processExcelData(data){

    importedRoutes = [];

    tableBody.innerHTML = "";

    deliveryList.innerHTML = "";

    clearMarkers();

    data.forEach((row)=>{

        const latitude =
        parseFloat(row["Latitude"]);

        const longitude =
        parseFloat(row["Longitude"]);

        if(
            isNaN(latitude) ||
            isNaN(longitude)
        ){
            return;
        }

        const item = {

            atId:
                row["AT ID"] || "Sem ID",

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

            latitude,

            longitude

        };

        importedRoutes.push(item);

        createTableRow(item);

    });

    updateDashboard();

    renderDeliveryList();

    focusRoutes();

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
                📍 ${route.bairro}
            </p>

            <p>
                🏙️ ${route.city}
            </p>

            <p>
                📮 ${route.zipcode}
            </p>

            <div class="street-badge">

                Stop:
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
            "Importe uma planilha."
        );

        return;

    }

    importedRoutes.forEach(route => {

        const marker = L.marker([
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

        routeMarkers.push(marker);

    });

    focusRoutes();

    showAlert(
        "Rotas carregadas."
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

    clearMarkers();

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

    Object.keys(groupedRoutes)
    .forEach(key => {

        const routes =
        groupedRoutes[key];

        if(routes.length > 1){

            const marker =
            L.circleMarker([
                routes[0].latitude,
                routes[0].longitude
            ],{

                radius:20,

                color:"#2563eb",

                fillColor:"#2563eb",

                fillOpacity:0.8,

                weight:2

            }).addTo(map);

            marker.bindPopup(`

                <div style="width:250px">

                    <h3>
                        📍 ${routes.length}
                        entregas
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

    showAlert(
        "Rotas agrupadas."
    );

}

/* =========================================
FOCAR ROTAS
========================================= */

function focusRoutes(){

    const bounds = [];

    importedRoutes.forEach(route => {

        bounds.push([
            route.latitude,
            route.longitude
        ]);

    });

    if(bounds.length > 0){

        map.fitBounds(bounds,{
            padding:[50,50]
        });

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
INICIAR ROTA
========================================= */

startRouteBtn?.addEventListener(
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

        return;

    }

    routeRunning = true;

    routePaused = false;

    routeStatusText.innerHTML =
    "Rota em andamento";

    routeIndicator?.classList.add(
        "status-active"
    );

    runRoute();

}

/* =========================================
EXECUTAR ROTA
========================================= */

function runRoute(){

    if(routePaused){

        return;

    }

    if(
        currentRouteIndex >=
        importedRoutes.length
    ){

        finishRoute();

        return;

    }

    const route =
    importedRoutes[currentRouteIndex];

    nextDelivery.innerHTML =
    route.atId;

    currentDistrict.innerHTML =
    route.bairro;

    estimatedTime.innerHTML =
    (
        (
            importedRoutes.length -
            currentRouteIndex
        ) * 4
    ) + " min";

    const progress =
    (
        (
            currentRouteIndex + 1
        )
        /
        importedRoutes.length
    ) * 100;

    progressFill.style.width =
    progress + "%";

    progressPercent.innerHTML =
    Math.round(progress) + "%";

    map.flyTo([
        route.latitude,
        route.longitude
    ],16);

    currentRouteIndex++;

    routeTimeout =
    setTimeout(() => {

        runRoute();

    },4000);

}

/* =========================================
PAUSAR
========================================= */

pauseRouteBtn?.addEventListener(
    "click",
    pauseRoute
);

function pauseRoute(){

    routePaused = true;

    clearTimeout(routeTimeout);

    routeStatusText.innerHTML =
    "Rota pausada";

}

/* =========================================
ENCERRAR
========================================= */

stopRouteBtn?.addEventListener(
    "click",
    stopRoute
);

function stopRoute(){

    clearTimeout(routeTimeout);

    routeRunning = false;

    routePaused = false;

    currentRouteIndex = 0;

    routeStatusText.innerHTML =
    "Rota encerrada";

    progressFill.style.width =
    "0%";

    progressPercent.innerHTML =
    "0%";

    nextDelivery.innerHTML =
    "---";

    currentDistrict.innerHTML =
    "---";

    estimatedTime.innerHTML =
    "---";

    routeIndicator?.classList.remove(
        "status-active"
    );

}

/* =========================================
FINALIZAR
========================================= */

function finishRoute(){

    routeRunning = false;

    routePaused = false;

    currentRouteIndex = 0;

    routeStatusText.innerHTML =
    "Rota concluída";

    progressFill.style.width =
    "100%";

    progressPercent.innerHTML =
    "100%";

    nextDelivery.innerHTML =
    "Concluído";

    estimatedTime.innerHTML =
    "0 min";

    routeIndicator?.classList.remove(
        "status-active"
    );

    showAlert(
        "Rota finalizada."
    );

}

/* =========================================
LOCALIZAÇÃO
========================================= */

function locateUser(){

    if(!navigator.geolocation){

        return;

    }

    navigator.geolocation
    .getCurrentPosition(position => {

        const lat =
        position.coords.latitude;

        const lng =
        position.coords.longitude;

        L.marker([lat,lng])
        .addTo(map)
        .bindPopup(
            "Sua localização"
        );

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

    downloadFile(
        blob,
        "routify.json"
    );

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

    downloadFile(
        blob,
        "routify.csv"
    );

}

/* =========================================
DOWNLOAD
========================================= */

function downloadFile(blob,fileName){

    const url =
    URL.createObjectURL(blob);

    const a =
    document.createElement("a");

    a.href = url;

    a.download = fileName;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);

}

/* =========================================
ALERTA
========================================= */

function showAlert(message){

    const alertBox =
    document.createElement("div");

    alertBox.className =
    "custom-alert";

    alertBox.innerHTML = message;

    Object.assign(alertBox.style,{

        position:"fixed",
        top:"20px",
        right:"20px",
        padding:"15px 20px",
        background:"#2563eb",
        color:"#fff",
        borderRadius:"14px",
        zIndex:"99999",
        fontWeight:"600",
        boxShadow:
        "0 10px 25px rgba(0,0,0,.25)"

    });

    document.body.appendChild(alertBox);

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

        if(
            e.key === "F5"
        ){

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
=================================

`);

locateUser();
