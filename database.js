// =============================================================================
// ROUTIFY PREMIUM - IndexedDB CORRIGIDO E OTIMIZADO
// =============================================================================

const DB_NAME = 'RoutifyPremiumDB';
const DB_VERSION = 1;
const STORE_NAME = 'entregas';

let dbInstance = null;

/**
 * Abre conexão única com o IndexedDB (evita múltiplas conexões)
 */
function inicializarBanco() {
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                console.log(`[Database] Store '${STORE_NAME}' criada.`);
            }
        };

        request.onsuccess = function (event) {
            dbInstance = event.target.result;

            // evita problemas de conexão fechada
            dbInstance.onversionchange = () => {
                dbInstance.close();
                dbInstance = null;
            };

            resolve(dbInstance);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

/**
 * Salva lista completa (substitui dados antigos)
 */
async function salvarDadosLocal(listaEntregas) {
    try {
        const db = await inicializarBanco();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            store.clear();

            transaction.oncomplete = function () {
                const tx2 = db.transaction([STORE_NAME], 'readwrite');
                const store2 = tx2.objectStore(STORE_NAME);

                listaEntregas.forEach(entrega => {
                    store2.put(entrega);
                });

                tx2.oncomplete = () => {
                    console.log(`[Database] ${listaEntregas.length} entregas salvas.`);
                    resolve(true);
                };

                tx2.onerror = (err) => reject(err);
            };

            transaction.onerror = (err) => reject(err);
        });

    } catch (error) {
        console.error('[Database] Erro ao salvar:', error);
    }
}

/**
 * Carrega todas as entregas
 */
async function carregarDadosLocal() {
    try {
        const db = await inicializarBanco();

        return new Promise((resolve) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });

    } catch (error) {
        console.error('[Database] Erro ao carregar:', error);
        return [];
    }
}

/**
 * Atualiza ou insere uma entrega específica
 */
async function atualizarEntregaUnica(entrega) {
    try {
        const db = await inicializarBanco();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const request = store.put(entrega);

            request.onsuccess = () => resolve(true);
            request.onerror = (err) => reject(err);
        });

    } catch (error) {
        console.error('[Database] Erro ao atualizar entrega:', error);
    }
}

/**
 * Remove banco completo
 */
function deletarBancoDeDados() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);

        request.onsuccess = () => {
            dbInstance = null;
            console.log("[Database] Banco deletado.");
            resolve(true);
        };

        request.onerror = (err) => reject(err);
    });
}
