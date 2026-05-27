// =============================================================================
// ROUTIFY PREMIUM - LOGICA DE NEGOCIOS E MAPEAMENTO (script.js)
// =============================================================================

// Variáveis Globais
let map;
let markersGroup;
let entregas = []; // Array que guardará todas as entregas do sistema

// Inicializa o sistema assim que a página carregar
document.addEventListener('DOMContentLoaded', () => {
    inicializarMapa();
    configurarEventos();
    carregarDadosIniciais();
});

// 1. INICIALIZAÇÃO DO MAPA (LEAFLET)
function inicializarMapa() {
    // Centraliza o mapa inicialmente em uma coordenada padrão (ex: São Paulo ou Centro do Brasil)
    map = L.map('map').setView([-23.55052, -46.633308], 13);

    // Adiciona a camada de mapa do OpenStreetMap (Visual moderno e limpo)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Grupo para gerenciar e limpar marcadores facilmente
    markersGroup = L.layerGroup().addTo(map);
}

// 2. CONFIGURAÇÃO DE EVENTOS DA INTERFACE (LISTENERS)
function configurarEventos() {
    // Upload de arquivo Excel / CSV
    document.getElementById('excelFile').addEventListener('change', lerPlanilha);

    // Filtro de Busca
    document.getElementById('searchInput').addEventListener('input', filtrarEntregas);

    // Botões de Ação (Ganchos para suas futuras lógicas de agrupamento/waze)
    document.getElementById('loadRoutesBtn').addEventListener('click', () => renderizarInterface());
    document.getElementById('groupRoutesBtn').addEventListener('click', agruparPorBairro);
    document.getElementById('startRouteBtn').addEventListener('click', iniciarRotas);
    document.getElementById('stopRouteBtn').addEventListener('click', pararRotas);
}

// 3. LEITURA DA PLANILHA (SHEETJS)
function lerPlanilha(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pega a primeira aba da planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte para JSON
        const dadosBrutos = XLSX.utils.sheet_to_json(worksheet);

        // Mapeia e padroniza os dados (Tratando as colunas da sua planilha)
        entregas = dadosBrutos.map((item, index) => ({
            id: index + 1,
            // Procura por colunas chamadas 'bairro', 'Bairro' ou usa padrão
            bairro: item.Bairro || item.bairro || "Bairro Não Informado",
            // Procura por 'numero', 'Número', 'Casa' ou deixa S/N
            numero: item.Numero || item.numero || item.Número || "S/N",
            // Simulação de coordenadas (Substitua pela sua lógica de Geocodificação real se houver)
            lat: item.Latitude || item.lat || (-23.55052 + (Math.random() - 0.5) * 0.05),
            lng: item.Longitude || item.lng || (-46.633308 + (Math.random() - 0.5) * 0.05),
            concluida: false // Toda entrega nova começa como pendente
        }));

        salvarNoBanco();
        renderizarInterface();
    };
    reader.readAsArrayBuffer(file);
}

// 4. RENDERIZAÇÃO COMPLETA DA INTERFACE (LISTA + MAPA + DASHBOARD)
function renderizarInterface() {
    renderizarListaCards(entregas);
    renderizarMarcadoresMapa(entregas);
    atualizarDashboard();
}

// A. Renderiza a lista de cards dinâmicos (Lateral)
function renderizarListaCards(listaParaExibir) {
    const listaContainer = document.getElementById('deliveryList');
    listaContainer.innerHTML = ''; // Limpa a lista atual

    if (listaParaExibir.length === 0) {
        listaContainer.innerHTML = '<p class="empty-msg">Nenhuma entrega encontrada.</p>';
        return;
    }

    listaParaExibir.forEach(entrega => {
        const card = document.createElement('div');
        // Se estiver concluída, adiciona a classe CSS para estilização diferenciada
        card.className = `delivery-card ${entrega.concluida ? 'concluida' : ''}`;
        card.id = `entrega-${entrega.id}`;

        card.innerHTML = `
            <div class="card-info" onclick="focarNoMapa(${entrega.lat}, ${entrega.lng})">
                <h3>${entrega.bairro}</h3>
                <p class="delivery-house-number">🏠 <strong>Número:</strong> ${entrega.numero}</p>
                <p class="status-badge">${entrega.concluida ? '✅ Concluída' : '⏳ Em progresso'}</p>
            </div>
            <div class="card-actions">
                <button class="action-btn-sm ${entrega.concluida ? 'btn-undo' : 'btn-done'}" 
                        onclick="alternarStatusEntrega(${entrega.id})">
                    ${entrega.concluida ? 'Refazer' : 'Concluir'}
                </button>
            </div>
        `;
        listaContainer.appendChild(card);
    });
}

// B. Renderiza os marcadores no Mapa com Leaflet
function renderizarMarcadoresMapa(listaParaExibir) {
    markersGroup.clearLayers(); // Remove marcadores antigos

    listaParaExibir.forEach(entrega => {
        // Define uma cor visual diferente se o ponto já foi concluído
        const markerColor = entrega.concluida ? '#10B981' : '#3B82F6';
        
        // Criando um ícone customizado simples via HTML/CSS do Leaflet
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
            iconSize: [12, 12]
        });

        const marker = L.marker([entrega.lat, entrega.lng], { icon: customIcon });

        // Exibe permanentemente o Número da Casa no mapa em cima do marcador
        marker.bindTooltip(`Nº ${entrega.numero}`, { 
            permanent: true, 
            direction: 'top', 
            className: entrega.concluida ? 'tooltip-concluido' : 'tooltip-pendente'
        });

        // Janela flutuante ao clicar no ponto do mapa
        marker.bindPopup(`
            <div class="map-popup">
                <h4>${entrega.bairro}</h4>
                <p><b>Número:</b> ${entrega.numero}</p>
                <p><b>Status:</b> ${entrega.concluida ? 'Concluída' : 'Pendente'}</p>
                <button class="action-btn success" onclick="alternarStatusEntrega(${entrega.id})" style="padding: 4px 8px; font-size: 11px; margin-top: 5px;">
                    ${entrega.concluida ? 'Marcar como Pendente' : 'Marcar como Concluída'}
                </button>
            </div>
        `);

        markersGroup.addLayer(marker);
    });

    // Ajusta o zoom do mapa para enquadrar todas as entregas na tela de forma inteligente
    if (listaParaExibir.length > 0) {
        const group = new L.featureGroup(markersGroup.getLayers());
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// 5. ALTERNAR STATUS DA ENTREGA (A SUA SOLICITAÇÃO)
function alternarStatusEntrega(id) {
    // Procura o item correspondente pelo ID
    const entrega = entregas.find(e => e.id === id);
    if (!entrega) return;

    // Inverte o estado (Se true vira false, se false vira true)
    entrega.concluida = !entrega.concluida;

    // Salva as alterações no banco de dados local para não perder ao recarregar a página
    salvarNoBanco();

    // Re-renderiza a tela para aplicar as modificações visuais nos marcadores e cards
    renderizarInterface();
}

// 6. ATUALIZAÇÃO DO DASHBOARD E BARRA DE PROGRESSO
function atualizarDashboard() {
    const total = entregas.length;
    const concluidas = entregas.filter(e => e.concluida).length;
    const emRota = total - concluidas;

    // Atualiza os números nos cards superiores do HTML
    document.getElementById('totalDeliveries').innerText = total;
    document.getElementById('inRoute').innerText = emRota;
    document.getElementById('completedRoutes').innerText = concluidas;

    // Atualiza a quantidade de bairros únicos (Agrupados)
    const bairrosUnicos = [...new Set(entregas.map(e => e.bairro))].length;
    document.getElementById('groupedStreets').innerText = bairrosUnicos;

    // Lógica da Barra de Progresso
    const porcentagem = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    document.getElementById('progressFill').style.width = `${porcentagem}%`;
    document.getElementById('progressText').innerText = `${porcentagem}%`;
}

// 7. MECANISMO DE BUSCA / FILTRO
function filtrarEntregas() {
    const termoBusca = document.getElementById('searchInput').value.toLowerCase();
    
    const entregasFiltradas = entregas.filter(entrega => {
        return entrega.bairro.toLowerCase().includes(termoBusca) || 
               entrega.numero.toString().toLowerCase().includes(termoBusca);
    });

    // Renderiza apenas os resultados compatíveis com a busca
    renderizarListaCards(entregasFiltradas);
    renderizarMarcadoresMapa(entregasFiltradas);
}

// 8. PERSISTÊNCIA DE DADOS (INTEGRAÇÃO COM O SEU DATABASE.JS)
function salvarNoBanco() {
    if (typeof salvarDadosLocal === 'function') {
        // Se você tiver essa função definida em seu database.js
        salvarDadosLocal(entregas);
    } else {
        // Fallback padrão usando LocalStorage caso o database.js esteja vazio
        localStorage.setItem('routify_entregas', JSON.stringify(entregas));
    }
}

function carregarDadosIniciais() {
    if (typeof carregarDadosLocal === 'function') {
        entregas = carregarDadosLocal() || [];
    } else {
        const dadosSalvos = localStorage.getItem('routify_entregas');
        entregas = dadosSalvos ? JSON.parse(dadosSalvos) : [];
    }
    
    if (entregas.length > 0) {
        renderizarInterface();
    }
}

// 9. FUNÇÕES AUXILIARES / INTERATIVIDADE
function focarNoMapa(lat, lng) {
    map.setView([lat, lng], 16, { animate: true, duration: 1 });
}

function locateUser() {
    map.locate({ setView: true, maxZoom: 16 });
    map.on('locationfound', (e) => {
        L.marker(e.latlng).addTo(map).bindPopup("Você está aqui").openPopup();
    });
}

// Funções de espaço reservado (placeholders) para os outros botões do seu layout
function agruparPorBairro() { alert("Inteligência Routify: Agrupando bairros semelhantes..."); }
function iniciarRotas() { alert("Rotas iniciadas! Integração com GPS ativa."); }
function pararRotas() { alert("Rotas pausadas."); }
