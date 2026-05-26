/* =========================================
   ROUTIFY PREMIUM - DATABASE.JS
   GERENCIAMENTO DE PERSISTÊNCIA LOCAL (IndexedDB)
   ========================================= */

const DB_NAME = "RoutifyDB";
const DB_VERSION = 1;
const STORE_NAME = "entregas";
let dbInstance = null;

/**
 * Inicializa o banco de dados IndexedDB
 * @return {Promise} Garante que o banco está pronto antes de usar
 */
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "data" });
                console.log(`Tabela '${STORE_NAME}' criada com sucesso.`);
            }
        };

        request.onsuccess = function(event) {
            dbInstance = event.target.result;
            console.log("Banco de dados IndexedDB conectado via database.js!");
            resolve(dbInstance);
        };

        request.onerror = function(event) {
            console.error("Erro ao abrir IndexedDB:", event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Retorna a data de hoje formatada em AAAA-MM-DD
 */
function getTodayDateString() {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

/**
 * Salva ou atualiza a lista de rotas do dia atual
 * @param {Array} routesList - Lista de objetos de entregas
 */
function saveRoutesToDB(routesList) {
    if (!dbInstance) {
        console.warn("Banco de dados não inicializado ainda.");
        return;
    }

    const todayStr = getTodayDateString();
    const transaction = dbInstance.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const dataToSave = {
        data: todayStr,
        routes: routesList,
        updatedAt: new Date().toISOString()
    };

    const request = store.put(dataToSave);

    request.onsuccess = function() {
        console.log(`Dados salvos/atualizados para o dia: ${todayStr}`);
    };

    request.onerror = function() {
        console.error("Erro ao salvar rotas no banco:", request.error);
    };
}

/**
 * Busca as rotas salvas do dia atual
 * @param {Function} callback - Função para processar os dados encontrados
 */
function loadRoutesFromDB(callback) {
    if (!dbInstance) return;

    const todayStr = getTodayDateString();
    const transaction = dbInstance.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(todayStr);

    request.onsuccess = function(event) {
        const result = event.target.result;
        if (result && result.routes) {
            callback(result.routes);
        } else {
            console.log(`Nenhuma rota encontrada no banco para o dia ${todayStr}.`);
        }
    };

    request.onerror = function() {
        console.error("Erro ao buscar rotas no banco:", request.error);
    };
}
