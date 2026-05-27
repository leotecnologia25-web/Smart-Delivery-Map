/* =========================================
   ROUTIFY PREMIUM - DATABASE.JS
   SISTEMA PROFISSIONAL DE PERSISTÊNCIA LOCAL
   IndexedDB + Estrutura Escalável
   ========================================= */

const DB_NAME = "RoutifyPremiumDB";
const DB_VERSION = 2;

const STORE_NAME = "entregas";

let dbInstance = null;

/* =========================================
   INICIALIZAÇÃO DO BANCO
   ========================================= */

function initDatabase() {

    // Evita abrir múltiplas conexões
    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );

        /* =========================================
           CRIAÇÃO / ATUALIZAÇÃO DO BANCO
           ========================================= */

        request.onupgradeneeded = function (event) {

            const db = event.target.result;

            // Remove store antiga se necessário
            if (
                db.objectStoreNames.contains(STORE_NAME)
            ) {
                db.deleteObjectStore(STORE_NAME);
            }

            // =====================================
            // NOVA STORE
            // =====================================

            const store = db.createObjectStore(
                STORE_NAME,
                {
                    keyPath: "id"
                }
            );

            // =====================================
            // ÍNDICES
            // =====================================

            store.createIndex(
                "cliente",
                "cliente",
                { unique: false }
            );

            store.createIndex(
                "status",
                "status",
                { unique: false }
            );

            store.createIndex(
                "data",
                "data",
                { unique: false }
            );

            store.createIndex(
                "motorista",
                "motorista",
                { unique: false }
            );

            store.createIndex(
                "bairro",
                "bairro",
                { unique: false }
            );

            store.createIndex(
                "updatedAt",
                "updatedAt",
                { unique: false }
            );

            console.log(
                "[DATABASE] Estrutura criada com sucesso."
            );

        };

        /* =========================================
           SUCESSO
           ========================================= */

        request.onsuccess = function (event) {

            dbInstance = event.target.result;

            console.log(
                "[DATABASE] IndexedDB conectado."
            );

            // =====================================
            // CONTROLE DE VERSÃO
            // =====================================

            dbInstance.onversionchange = () => {

                console.warn(
                    "[DATABASE] Versão alterada. Fechando conexão."
                );

                dbInstance.close();

                dbInstance = null;

            };

            resolve(dbInstance);

        };

        /* =========================================
           ERRO
           ========================================= */

        request.onerror = function (event) {

            console.error(
                "[DATABASE] Erro ao abrir banco:",
                event.target.error
            );

            reject(event.target.error);

        };

    });

}

/* =========================================
   GERA ID ÚNICO
   ========================================= */

function generateId() {

    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 9)
    );

}

/* =========================================
   DATA FORMATADA
   ========================================= */

function getTodayDateString() {

    const today = new Date();

    const offset = today.getTimezoneOffset();

    const localDate = new Date(
        today.getTime() - (offset * 60 * 1000)
    );

    return localDate
        .toISOString()
        .split("T")[0];

}

/* =========================================
   SALVAR ENTREGA INDIVIDUAL
   ========================================= */

async function saveDelivery(deliveryData) {

    try {

        const db = await initDatabase();

        return new Promise((resolve, reject) => {

            const transaction = db.transaction(
                [STORE_NAME],
                "readwrite"
            );

            const store = transaction.objectStore(
                STORE_NAME
            );

            const dataToSave = {

                id:
                    deliveryData.id ||
                    generateId(),

                cliente:
                    deliveryData.cliente || "",

                telefone:
                    deliveryData.telefone || "",

                endereco:
                    deliveryData.endereco || "",

                bairro:
                    deliveryData.bairro || "",

                observacao:
                    deliveryData.observacao || "",

                motorista:
                    deliveryData.motorista || "",

                status:
                    deliveryData.status || "pendente",

                latitude:
                    deliveryData.latitude || null,

                longitude:
                    deliveryData.longitude || null,

                data:
                    deliveryData.data ||
                    getTodayDateString(),

                createdAt:
                    deliveryData.createdAt ||
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()

            };

            const request = store.put(dataToSave);

            request.onsuccess = function () {

                console.log(
                    "[DATABASE] Entrega salva:",
                    dataToSave.id
                );

                resolve(dataToSave);

            };

            request.onerror = function () {

                console.error(
                    "[DATABASE] Erro ao salvar entrega:",
                    request.error
                );

                reject(request.error);

            };

        });

    } catch (error) {

        console.error(
            "[DATABASE] Falha geral ao salvar:",
            error
        );

    }

}

/* =========================================
   LISTAR TODAS AS ENTREGAS
   ========================================= */

async function loadAllDeliveries() {

    try {

        const db = await initDatabase();

        return new Promise((resolve, reject) => {

            const transaction = db.transaction(
                [STORE_NAME],
                "readonly"
            );

            const store = transaction.objectStore(
                STORE_NAME
            );

            const request = store.getAll();

            request.onsuccess = function () {

                const result =
                    request.result || [];

                console.log(
                    `[DATABASE] ${result.length} entregas carregadas.`
                );

                resolve(result);

            };

            request.onerror = function () {

                console.error(
                    "[DATABASE] Erro ao buscar entregas."
                );

                reject(request.error);

            };

        });

    } catch (error) {

        console.error(
            "[DATABASE] Falha ao carregar entregas:",
            error
        );

        return [];

    }

}

/* =========================================
   BUSCAR ENTREGA POR ID
   ========================================= */

async function getDeliveryById(id) {

    try {

        const db = await initDatabase();

        return new Promise((resolve, reject) => {

            const transaction = db.transaction(
                [STORE_NAME],
                "readonly"
            );

            const store = transaction.objectStore(
                STORE_NAME
            );

            const request = store.get(id);

            request.onsuccess = function () {

                resolve(request.result);

            };

            request.onerror = function () {

                reject(request.error);

            };

        });

    } catch (error) {

        console.error(
            "[DATABASE] Erro ao buscar entrega:",
            error
        );

    }

}

/* =========================================
   ATUALIZAR ENTREGA
   ========================================= */

async function updateDelivery(id, updatedData) {

    try {

        const currentData =
            await getDeliveryById(id);

        if (!currentData) {

            console.warn(
                "[DATABASE] Entrega não encontrada."
            );

            return;

        }

        const updatedDelivery = {

            ...currentData,
            ...updatedData,

            updatedAt:
                new Date().toISOString()

        };

        return await saveDelivery(
            updatedDelivery
        );

    } catch (error) {

        console.error(
            "[DATABASE] Erro ao atualizar:",
            error
        );

    }

}

/* =========================================
   REMOVER ENTREGA
   ========================================= */

async function deleteDelivery(id) {

    try {

        const db = await initDatabase();

        return new Promise((resolve, reject) => {

            const transaction = db.transaction(
                [STORE_NAME],
                "readwrite"
            );

            const store = transaction.objectStore(
                STORE_NAME
            );

            const request = store.delete(id);

            request.onsuccess = function () {

                console.log(
                    "[DATABASE] Entrega removida:",
                    id
                );

                resolve(true);

            };

            request.onerror = function () {

                reject(request.error);

            };

        });

    } catch (error) {

        console.error(
            "[DATABASE] Erro ao deletar entrega:",
            error
        );

    }

}

/* =========================================
   FILTRAR POR STATUS
   ========================================= */

async function getDeliveriesByStatus(status) {

    try {

        const db = await initDatabase();

        return new Promise((resolve, reject) => {

            const transaction = db.transaction(
                [STORE_NAME],
                "readonly"
            );

            const store = transaction.objectStore(
                STORE_NAME
            );

            const index = store.index("status");

            const request = index.getAll(status);

            request.onsuccess = function () {

                resolve(request.result || []);

            };

            request.onerror = function () {

                reject(request.error);

            };

        });

    } catch (error) {

        console.error(
            "[DATABASE] Erro ao filtrar status:",
            error
        );

        return [];

    }

}

/* =========================================
   LIMPAR BANCO COMPLETO
   ========================================= */

async function clearDatabase() {

    try {

        const db = await initDatabase();

        return new Promise((resolve, reject) => {

            const transaction = db.transaction(
                [STORE_NAME],
                "readwrite"
            );

            const store = transaction.objectStore(
                STORE_NAME
            );

            const request = store.clear();

            request.onsuccess = function () {

                console.log(
                    "[DATABASE] Banco limpo com sucesso."
                );

                resolve(true);

            };

            request.onerror = function () {

                reject(request.error);

            };

        });

    } catch (error) {

        console.error(
            "[DATABASE] Erro ao limpar banco:",
            error
        );

    }

}

/* =========================================
   DELETAR BANCO COMPLETO
   ========================================= */

function deleteDatabase() {

    return new Promise((resolve, reject) => {

        if (dbInstance) {

            dbInstance.close();

            dbInstance = null;

        }

        const request = indexedDB.deleteDatabase(
            DB_NAME
        );

        request.onsuccess = function () {

            console.log(
                "[DATABASE] Banco deletado."
            );

            resolve(true);

        };

        request.onerror = function () {

            console.error(
                "[DATABASE] Erro ao deletar banco."
            );

            reject(request.error);

        };

    });

}
