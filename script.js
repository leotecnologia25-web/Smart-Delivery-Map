// =============================================================================
// ROUTIFY PREMIUM - LÓGICA DE NEGÓCIOS E INTERFACE MAPAS (script.js)
// =============================================================================

// Variáveis Globais
let map;
let markersGroup;
let entregas = []; // Armazenará a lista ativa de entregas

// Inicializa o sistema assim que a estrutura do HTML estiver pronta
document.addEventListener('DOMContentLoaded', () => {
    inicializarMapa();
    configurarEventos();
    carregarDadosIniciais();
});

// =============================================================================
// 1. INICIALIZAÇÃO DO MOTOR DE MAPAS (LEAFLET)
// =============================================================================
function inicializarMapa() {
    // Centraliza o mapa inicialmente em uma coordenada padrão (Ex: São Paulo)
    map = L.map('map').setView([-23.55052, -46.633308], 13);

    // Adiciona a camada de mapa (OpenStreetMap) com visual moderno
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Cria um grupo para gerenciar e limpar os marcadores facilmente
    markersGroup = L.layerGroup().addTo(map);
}

// =============================================================================
// 2. CONFIGURAÇÃO DOS EVENTOS DA INTERFACE (LISTENERS)
// =============================================================================
function configurarEventos() {
    // Evento de Upload de Planilha (Excel / CSV)
    document.getElementById('excelFile').addEventListener('change', lerPlanilha);

    // Filtro de Busca na Barra de Pesquisa
    document.getElementById('searchInput').addEventListener('input', filtrarEntregas);

    // Botões de Ação da Barra Lateral
    document.getElementById('loadRoutesBtn').addEventListener('click', () => renderizarInterface());
    document.getElementById('groupRoutesBtn').addEventListener('click', agruparPorBairro);
    document.getElementById('startRouteBtn').addEventListener('click', iniciarRotas);
    document.getElementById('stopRouteBtn').addEventListener('click', pararRotas);
}

// =============================================================================
// 3. LEITURA E TRATAMENTO DA PLANILHA (SHEETJS)
// =============================================================================
function lerPlanilha(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Seleciona a primeira aba da planilha importada
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte as linhas da planilha em um Array de Objetos JSON
        const dadosBrutos = XLSX.utils.sheet_to_json(worksheet);

        // Mapeia e padroniza os campos obrigatórios (Bairro e Número)
        entregas = dadosBrutos.map((item, index) => ({
            id: index + 1,
            // Suporta colunas escritas em maiúsculo ou minúsculo
            bairro: item.Bairro || item.bairro || "Bairro Não Informado",
            // Captura o número residencial de colunas comuns
            numero: item.Numero || item.numero || item.Número || item.Casa || "S/N",
            // Gera coordenadas fictícias próximas caso a planilha não possua Latitude/Longitude
            lat: item.Latitude || item.lat || (-23.55052 + (Math.random() - 0.5) * 0.05),
            lng: item.Longitude || item.lng || (-46.633308 + (Math.random() - 0.5) * 0.05),
            concluida: false // Inicia por padrão como pendente
        }));

        // Salva o lote de dados importados no IndexedDB
        salvarNoBanco();
        // Atualiza a tela
        renderizarInterface();
    };
    reader.readAsArrayBuffer(file);
}

// =============================================================================
// 4. CONTROLE DE RENDERIZAÇÃO DA INTERFACE
// =============================================================================
function renderizarInterface() {
    renderizarListaCards(entregas);
    renderizarMarcadoresMapa(entregas);
    atualizarDashboard();
}

// A. Renderiza os Cards Dinâmicos na Barra Lateral
function renderizarListaCards(listaParaExibir) {
    const listaContainer = document.getElementById('deliveryList');
    listaContainer.innerHTML = ''; // Limpa a listagem anterior

    if (listaParaExibir.length === 0) {
        listaContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">Nenhuma entrega encontrada.</p>';
        return;
    }

    listaParaExibir.forEach(entrega => {
        const card = document.createElement('div');
        // Adiciona a classe 'concluida' dinamicamente para estilização no CSS
        card.className = `delivery-card ${entrega.concluida ? 'concluida' : ''}`;
        card.id = `entrega-${entrega.id}`;

        card.innerHTML = `
            <div class="card-info" onclick="focarNoMapa(${entrega.lat}, ${entrega.lng})">
                <h3>${entrega.bairro}</h3>
                <p class="delivery-house-number">🏠 <strong>Número:</strong> ${entrega.numero}</p>
                <p class="status-badge" style="color: ${entrega.concluida ? '#10B981' : '#F59E0B'}">
                    ${entrega.concluida ? '✅ Concluída' : '⏳ Em progresso'}
                </p>
            </div>
            <div class="card-actions">
                <button class="action-btn-sm" 
                        style="background-color: ${entrega.concluida ? '#6B7280' : '#10B981'}; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;"
                        onclick="alternarStatusEntrega(${entrega.id})">
                    ${entrega.concluida ? 'Refazer' : 'Concluir'}
                </button>
            </div>
        `;
        listaContainer.appendChild(card);
    });
}

// B. Renderiza os Marcadores e as Etiquetas de Número no Mapa
function renderizarMarcadoresMapa(listaParaExibir) {
    markersGroup.clearLayers(); // Remove marcadores antigos para evitar sobreposição

    listaParaExibir.forEach(entrega => {
        // Altera a cor do marcador com base no status de conclusão
        const corMarcador = entrega.concluida ? '#10B981' : '#3B82F6';
        
        // Ícone customizado minimalista em formato de ponto (Dot Marker)
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${corMarcador}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [14, 14]
        });

        const marker = L.marker([entrega.lat, entrega.lng], { icon: customIcon });

        // EXIBE O NÚMERO DA RESIDÊNCIA FIXO ACIMA DO MARCADOR
        marker.bindTooltip(`Nº ${entrega.numero}`, { 
            permanent: true, 
            direction: 'top',
            offset: [0, -5],
            className: `map-tooltip-style ${entrega.concluida ? 'tooltip-concluido' : 'tooltip-pendente'}`
        });

        // Janela Pop-up ao clicar no ponto do mapa
        marker.bindPopup(`
            <div style="font-family: 'Inter', sans-serif; padding: 5px;">
