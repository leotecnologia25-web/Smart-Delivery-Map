/* =========================================
   BANCO DE DADOS - ROUTIFY
========================================= */

class RoutifyDatabase {
    
    constructor() {
        this.dbName = 'RoutifyDB';
        this.dbVersion = 1;
        this.storeName = 'rotas';
        this.db = null;
        this.initDB();
    }

    /* =========================================
       INICIALIZAR BANCO DE DADOS
    ========================================= */

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Erro ao abrir banco de dados');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Banco de dados inicializado');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('atId', 'atId', { unique: false });
                    store.createIndex('bairro', 'bairro', { unique: false });
                    store.createIndex('zipcode', 'zipcode', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('Object Store criado com sucesso');
                }
            };
        });
    }

    /* =========================================
       ADICIONAR ROTA
    ========================================= */

    addRota(rota) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            rota.timestamp = new Date().toISOString();
            
            const request = store.add(rota);

            request.onsuccess = () => {
                console.log('Rota adicionada:', rota);
                resolve(rota);
            };

            request.onerror = () => {
                console.error('Erro ao adicionar rota');
                reject(request.error);
            };
        });
    }

    /* =========================================
       ADICIONAR MÚLTIPLAS ROTAS
    ========================================= */

    addMultiplasRotas(rotas) {
        return Promise.all(rotas.map(rota => this.addRota(rota)));
    }

    /* =========================================
       OBTER TODAS AS ROTAS
    ========================================= */

    getAllRotas() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                console.log('Rotas recuperadas:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Erro ao obter rotas');
                reject(request.error);
            };
        });
    }

    /* =========================================
       OBTER ROTA POR ID
    ========================================= */

    getRotaById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                console.log('Rota encontrada:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Erro ao obter rota');
                reject(request.error);
            };
        });
    }

    /* =========================================
       BUSCAR ROTAS POR BAIRRO
    ========================================= */

    getRotasByBairro(bairro) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('bairro');
            const request = index.getAll(bairro);

            request.onsuccess = () => {
                console.log(`Rotas no bairro "${bairro}":`, request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Erro ao buscar rotas por bairro');
                reject(request.error);
            };
        });
    }

    /* =========================================
       BUSCAR ROTAS POR CEP
    ========================================= */

    getRotasByZipcode(zipcode) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('zipcode');
            const request = index.getAll(zipcode);

            request.onsuccess = () => {
                console.log(`Rotas com CEP "${zipcode}":`, request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Erro ao buscar rotas por CEP');
                reject(request.error);
            };
        });
    }

    /* =========================================
       ATUALIZAR ROTA
    ========================================= */

    updateRota(id, rotaAtualizada) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            rotaAtualizada.id = id;
            rotaAtualizada.timestamp = new Date().toISOString();
            
            const request = store.put(rotaAtualizada);

            request.onsuccess = () => {
                console.log('Rota atualizada:', rotaAtualizada);
                resolve(rotaAtualizada);
            };

            request.onerror = () => {
                console.error('Erro ao atualizar rota');
                reject(request.error);
            };
        });
    }

    /* =========================================
       DELETAR ROTA
    ========================================= */

    deleteRota(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log(`Rota ${id} deletada`);
                resolve();
            };

            request.onerror = () => {
                console.error('Erro ao deletar rota');
                reject(request.error);
            };
        });
    }

    /* =========================================
       DELETAR MÚLTIPLAS ROTAS
    ========================================= */

    deleteMultiplasRotas(ids) {
        return Promise.all(ids.map(id => this.deleteRota(id)));
    }

    /* =========================================
       LIMPAR TODAS AS ROTAS
    ========================================= */

    clearAllRotas() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('Todas as rotas foram deletadas');
                resolve();
            };

            request.onerror = () => {
                console.error('Erro ao limpar banco de dados');
                reject(request.error);
            };
        });
    }

    /* =========================================
       CONTAR ROTAS
    ========================================= */

    countRotas() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count();

            request.onsuccess = () => {
                console.log(`Total de rotas: ${request.result}`);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Erro ao contar rotas');
                reject(request.error);
            };
        });
    }

    /* =========================================
       EXPORTAR ROTAS (JSON)
    ========================================= */

    exportRotasJSON() {
        return new Promise((resolve, reject) => {
            this.getAllRotas().then(rotas => {
                const data = JSON.stringify(rotas, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `routify_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                resolve(rotas);
            }).catch(reject);
        });
    }

    /* =========================================
       IMPORTAR ROTAS (JSON)
    ========================================= */

    importRotasJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const rotas = JSON.parse(e.target.result);
                    this.clearAllRotas().then(() => {
                        this.addMultiplasRotas(rotas).then(() => {
                            console.log('Rotas importadas com sucesso');
                            resolve(rotas);
                        }).catch(reject);
                    }).catch(reject);
                } catch (error) {
                    console.error('Erro ao importar JSON:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    /* =========================================
       OBTER ESTATÍSTICAS
    ========================================= */

    async getEstatisticas() {
        const todasRotas = await this.getAllRotas();
        const totalRotas = todasRotas.length;
        
        const bairros = {};
        const cidades = {};
        const ceps = {};

        todasRotas.forEach(rota => {
            bairros[rota.bairro] = (bairros[rota.bairro] || 0) + 1;
            cidades[rota.city] = (cidades[rota.city] || 0) + 1;
            ceps[rota.zipcode] = (ceps[rota.zipcode] || 0) + 1;
        });

        return {
            totalRotas,
            totalBairros: Object.keys(bairros).length,
            totalCidades: Object.keys(cidades).length,
            totalCeps: Object.keys(ceps).length,
            bairros,
            cidades,
            ceps
        };
    }

    /* =========================================
       RESETAR BANCO DE DADOS
    ========================================= */

    resetDatabase() {
        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(this.dbName);
            
            deleteRequest.onsuccess = () => {
                console.log('Banco de dados resetado');
                this.db = null;
                this.initDB().then(resolve).catch(reject);
            };
            
            deleteRequest.onerror = () => {
                console.error('Erro ao resetar banco de dados');
                reject(deleteRequest.error);
            };
        });
    }
}

// Criar instância global do banco de dados
const routifyDB = new RoutifyDatabase();
