// =============================================================================
// ROUTIFY PREMIUM - SCRIPT PRINCIPAL (script.js)
// =============================================================================

// Lista em memória (estado da aplicação)
let entregas = [];

/**
 * Inicialização do sistema
 */
async function initApp() {
    entregas = await carregarDadosLocal();
    renderizarEntregas();
    console.log("[App] Sistema iniciado com sucesso.");
}

/**
 * Gera ID único simples
 */
function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * ADICIONAR NOVA ENTREGA
 */
async function adicionarEntrega(nome, endereco, status = "pendente") {
    const novaEntrega = {
        id: gerarId(),
        nome,
        endereco,
        status,
        dataCriacao: new Date().toISOString()
    };

    entregas.push(novaEntrega);

    await salvarDadosLocal(entregas);
    renderizarEntregas();
}

/**
 * ATUALIZAR ENTREGA COMPLETA
 */
async function atualizarEntrega(id, novosDados) {
    const index = entregas.findIndex(e => e.id === id);

    if (index === -1) return;

    entregas[index] = {
        ...entregas[index],
        ...novosDados
    };

    await atualizarEntregaUnica(entregas[index]);
    renderizarEntregas();
}

/**
 * MARCAR COMO CONCLUÍDA
 */
async function concluirEntrega(id) {
    await atualizarEntrega(id, { status: "concluida" });
}

/**
 * REMOVER ENTREGA
 */
async function removerEntrega(id) {
    entregas = entregas.filter(e => e.id !== id);

    await salvarDadosLocal(entregas);
    renderizarEntregas();
}

/**
 * LIMPAR TUDO (RESET)
 */
async function resetSistema() {
    await deletarBancoDeDados();
    entregas = [];
    renderizarEntregas();
}

/**
 * RENDERIZAÇÃO SIMPLES (UI BÁSICA)
 */
function renderizarEntregas() {
    const container = document.getElementById("listaEntregas");
    if (!container) return;

    container.innerHTML = "";

    entregas.forEach(entrega => {
        const div = document.createElement("div");

        div.style.padding = "10px";
        div.style.margin = "5px";
        div.style.border = "1px solid #ccc";

        div.innerHTML = `
            <strong>${entrega.nome}</strong><br>
            ${entrega.endereco}<br>
            Status: ${entrega.status}<br><br>

            <button onclick="concluirEntrega('${entrega.id}')">Concluir</button>
            <button onclick="removerEntrega('${entrega.id}')">Excluir</button>
        `;

        container.appendChild(div);
    });
}

/**
 * EXEMPLO DE SUBMIT (FORM)
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const endereco = document.getElementById("endereco").value;

    await adicionarEntrega(nome, endereco);

    document.getElementById("nome").value = "";
    document.getElementById("endereco").value = "";
}

/**
 * BUSCA SIMPLES
 */
function buscarEntregas(termo) {
    const resultado = entregas.filter(e =>
        e.nome.toLowerCase().includes(termo.toLowerCase()) ||
        e.endereco.toLowerCase().includes(termo.toLowerCase())
    );

    return resultado;
}

/**
 * FILTRO POR STATUS
 */
function filtrarPorStatus(status) {
    return entregas.filter(e => e.status === status);
}

// =============================================================================
// EVENTO INICIAL
// =============================================================================
window.addEventListener("load", initApp);
