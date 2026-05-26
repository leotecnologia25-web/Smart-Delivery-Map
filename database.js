/* =========================================
ROUTIFY PREMIUM
DATABASE.JS
BANCO LOCAL COMPLETO
========================================= */

/* =========================================
CONFIG
========================================= */

const DB_NAME =
"routify_database";

const DB_VERSION = 1;

const STORE_ROUTES =
"routes";

const STORE_SETTINGS =
"settings";

let db = null;

/* =========================================
INICIAR DATABASE
========================================= */

function initDatabase(){

    return new Promise((resolve,reject)=>{

        const request =
        indexedDB.open(
            DB_NAME,
            DB_VERSION
        );

        /* =====================================
        ERRO
        ===================================== */

        request.onerror = function(event){

            console.error(
                "Erro ao abrir database",
                event
            );

            reject(event);

        };

        /* =====================================
        SUCESSO
        ===================================== */

        request.onsuccess = function(event){

            db = event.target.result;

            console.log(
                "Database conectado."
            );

            resolve(db);

        };

        /* =====================================
        CRIAR STORES
        ===================================== */

        request.onupgradeneeded =
        function(event){

            db =
            event.target.result;

            /* =================================
            ROTAS
            ================================= */

            if(
                !db.objectStoreNames.contains(
                    STORE_ROUTES
                )
            ){

                const routesStore =
                db.createObjectStore(
                    STORE_ROUTES,
                    {
                        keyPath:"id",
                        autoIncrement:true
                    }
                );

                routesStore.createIndex(
                    "bairro",
                    "bairro",
                    {unique:false}
                );

                routesStore.createIndex(
                    "city",
                    "city",
                    {unique:false}
                );

                routesStore.createIndex(
                    "sequence",
                    "sequence",
                    {unique:false}
                );

            }

            /* =================================
            SETTINGS
            ================================= */

            if(
                !db.objectStoreNames.contains(
                    STORE_SETTINGS
                )
            ){

                db.createObjectStore(
                    STORE_SETTINGS,
                    {
                        keyPath:"key"
                    }
                );

            }

            console.log(
                "Stores criadas."
            );

        };

    });

}

/* =========================================
SALVAR ROTA
========================================= */

function saveRoute(route){

    return new Promise((resolve,reject)=>{

        const transaction =
        db.transaction(
            [STORE_ROUTES],
            "readwrite"
        );

        const store =
        transaction.objectStore(
            STORE_ROUTES
        );

        const request =
        store.add(route);

        request.onsuccess =
        function(){

            console.log(
                "Rota salva."
            );

            resolve();

        };

        request.onerror =
        function(error){

            console.error(
                "Erro salvar rota",
                error
            );

            reject(error);

        };

    });

}

/* =========================================
SALVAR MÚLTIPLAS ROTAS
========================================= */

async function saveMultipleRoutes(routes){

    for(const route of routes){

        await saveRoute(route);

    }

    console.log(
        routes.length +
        " rotas salvas."
    );

}

/* =========================================
BUSCAR TODAS ROTAS
========================================= */

function getAllRoutes(){

    return new Promise((resolve,reject)=>{

        const transaction =
        db.transaction(
            [STORE_ROUTES],
            "readonly"
        );

        const store =
        transaction.objectStore(
            STORE_ROUTES
        );

        const request =
        store.getAll();

        request.onsuccess =
        function(){

            resolve(
                request.result
            );

        };

        request.onerror =
        function(error){

            reject(error);

        };

    });

}

/* =========================================
BUSCAR POR BAIRRO
========================================= */

function getRoutesByBairro(bairro){

    return new Promise((resolve,reject)=>{

        const transaction =
        db.transaction(
            [STORE_ROUTES],
            "readonly"
        );

        const store =
        transaction.objectStore(
            STORE_ROUTES
        );

        const index =
        store.index("bairro");

        const request =
        index.getAll(bairro);

        request.onsuccess =
        function(){

            resolve(
                request.result
            );

        };

        request.onerror =
        function(error){

            reject(error);

        };

    });

}

/* =========================================
ATUALIZAR ROTA
========================================= */

function updateRoute(route){

    return new Promise((resolve,reject)=>{

        const transaction =
        db.transaction(
            [STORE_ROUTES],
            "readwrite"
        );

        const store =
        transaction.objectStore(
            STORE_ROUTES
        );

        const request =
        store.put(route);

        request.onsuccess =
        function(){

            resolve();

        };

        request.onerror =
        function(error){

            reject(error);

        };

    });

}

/* =========================================
REMOVER ROTA
========================================= */

function deleteRoute(id){

    return new Promise((resolve,reject)=>{

        const transaction =
        db.transaction(
            [STORE_ROUTES],
            "readwrite"
        );

        const store =
        transaction.objectStore(
            STORE_ROUTES
        );

        const request =
        store.delete(id);

        request.onsuccess =
        function(){

            resolve();

        };

        request.onerror =
        function(error){

            reject(error);

        };

    });

}

/* =========================================
LIMPAR DATABASE
========================================= */

function clearRoutes(){

    return new Promise((resolve,reject)=>{

        const transaction =
        db.transaction(
            [STORE_ROUTES],
            "readwrite"
        );

        const store =
        transaction.objectStore(
            STORE_ROUTES
        );

        const request =
        store.clear();

        request.onsuccess =
        function(){

            console.log(
                "Database limpa."
            );

            resolve();

        };

        request.onerror =
        function(error){

            reject(error);

        };

    });

}

/* =========================================
SALVAR CONFIGURAÇÃO
========================================= */

function saveSetting(key,value){

    return new Promise((resolve,reject)=>{

        const transaction =
        db.transaction(
            [STORE_SETTINGS],
            "readwrite"
        );

        const store =
        transaction.objectStore(
            STORE_SETTINGS
        );

        const request =
        store.put({
            key:key,
            value:value
        });

        request.onsuccess =
        function(){

            resolve();

        };

        request.onerror =
        function(error){

            reject(error);

        };

    });

}

/* =========================================
BUSCAR CONFIGURAÇÃO
========================================= */

function getSetting(key){

    return new Promise((resolve,reject)=>{

        const transaction =
        db.transaction(
            [STORE_SETTINGS],
            "readonly"
        );

        const store =
        transaction.objectStore(
            STORE_SETTINGS
        );

        const request =
        store.get(key);

        request.onsuccess =
        function(){

            if(request.result){

                resolve(
                    request.result.value
                );

            }else{

                resolve(null);

            }

        };

        request.onerror =
        function(error){

            reject(error);

        };

    });

}

/* =========================================
EXPORTAR DATABASE JSON
========================================= */

async function exportDatabase(){

    const routes =
    await getAllRoutes();

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
    "routify_backup.json";

    a.click();

}

/* =========================================
IMPORTAR DATABASE JSON
========================================= */

async function importDatabase(file){

    const reader =
    new FileReader();

    reader.onload =
    async function(event){

        const routes =
        JSON.parse(
            event.target.result
        );

        await clearRoutes();

        await saveMultipleRoutes(
            routes
        );

        console.log(
            "Backup importado."
        );

    };

    reader.readAsText(file);

}

/* =========================================
ESTATÍSTICAS
========================================= */

async function getDatabaseStats(){

    const routes =
    await getAllRoutes();

    const bairros = {};

    routes.forEach(route => {

        bairros[
            route.bairro
        ] = true;

    });

    return {

        totalRoutes:
        routes.length,

        totalBairros:
        Object.keys(
            bairros
        ).length

    };

}

/* =========================================
AUTO SAVE
========================================= */

async function autoSave(routes){

    await clearRoutes();

    await saveMultipleRoutes(
        routes
    );

    console.log(
        "Auto save executado."
    );

}

/* =========================================
INICIALIZAR
========================================= */

initDatabase()
.then(()=>{

    console.log(`

=================================
ROUTIFY DATABASE ONLINE
=================================

    `);

})
.catch(error=>{

    console.error(
        "Erro database",
        error
    );

});
