// =============================================================================
// ROUTIFY PREMIUM - GERENCIAMENTO DE BANCO DE DADOS LOCAL (database.js)
// =============================================================================

const DB_NAME = 'RoutifyPremiumDB';
const DB_VERSION = 1;
const STORE_NAME = 'entregas';

/**
 * Inicializa o Banco de Dados IndexedDB de forma assíncrona.
 * Cria a estrutura de tabelas (Object Stores) caso não existam.
 */
function inicializarBanco() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Executado se for a primeira vez abrindo o app ou se a versão mudar
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Cria a tabela de entregas usando o 'id' como chave primária
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                console.log(`[Database] Tabela '${STORE_NAME}' criada com sucesso.`);
            }
        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            console.error('[Database] Erro ao abrir o banco de dados:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Limpa os registros antigos e salva a nova lista de entregas de uma vez.
 * @param {Array} listaEntregas - Array de objetos de entregas vindos do script.js
 */
async function salvarDadosLocal(listaEntregas) {
    try {
        const db = await inicializarBanco();
        
        // Abre uma transação de leitura e escrita
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // 1. Limpa o banco anterior para evitar duplicidade de planilhas antigas
        store.clear();

        // 2. Salva item por item da nova lista
        listaEntregas.forEach(entrega => {
            store.put(entrega);
        });

        transaction.oncomplete = function() {
            console.log(`[Database] ${listaEntregas.length} entregas sincronizadas no banco local.`);
        };

        transaction.onerror = function(event) {
            console.error('[Database] Erro na transação de salvamento:', event.target.error);
        };

    } catch (error) {
        console.error('[Database] Falha ao executar salvamento:', error);
    }
}

/**
 * Recupera todas as entregas armazenadas no banco local.
 * @returns {Promise<Array>} Retorna uma promessa com a lista de entregas.
 */
function carregarDadosLocal() {
    return new Promise(async (resolve) => {
        try {
            const db = await inicializarBanco();
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll(); // Puxa todos os registros de uma vez

            request.onsuccess = function(event) {
                const resultado = event.target.result || [];
                console.log(`[Database] ${resultado.length} registros carregados do armazenamento local.`);
                resolve(resultado);
            };

            request.onerror = function(event) {
                console.error('[Database] Erro ao buscar registros:', event.target.error);
                resolve([]);
            };

        } catch (error) {
            console.error('[Database] Falha ao carregar dados:', error);
            resolve([]);
        }
    });
}

/**
 * Atualiza apenas uma entrega específica (Útil para marcar como concluído rapidamente)
 * @param {Object} entrega - Objeto da entrega modificado
 */
async function atualizarEntregaUnica(entrega) {
    try {
        const db = await inicializarBanco();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        store.put(entrega); 
        
    } catch (error) {
        console.error('[Database] Erro ao atualizar entrega individual:', error);
    }
}

/**
 * Deleta todo o banco de dados (Útil para funções de 'Reset' ou 'Limpar Dados')
 */
function deletarBancoDeDados() {
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = function() {
        console.log("[Database] Banco de dados deletado com sucesso.");
    };
    
    request.onerror = function() {
        console.error("[Database] Erro ao deletar banco de dados.");
    };
}
