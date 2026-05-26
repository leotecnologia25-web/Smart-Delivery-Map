# 🗺️ Routify - Sistema Inteligente de Entregas

Um sistema web moderno e responsivo para otimizar rotas de entrega, agrupando endereços na mesma rua e exibindo tudo em um mapa interativo.

## 🎯 Funcionalidades

- ✅ **Mapa Interativo** - Visualize todas as entregas em tempo real
- ✅ **Agrupamento Inteligente** - Entregas na mesma rua são agrupadas automaticamente
- ✅ **Dashboard Dinâmico** - Métricas em tempo real
- ✅ **Importação de Excel** - Adicione entregas via planilha (.xlsx, .xls, .csv)
- ✅ **Geolocalização** - Converte endereços em coordenadas automaticamente
- ✅ **Filtros e Buscas** - Encontre entregas rapidamente
- ✅ **Status das Entregas** - Pendente, Em Rota, Entregue
- ✅ **Design Responsivo** - Funciona em desktop, tablet e mobile
- ✅ **Dark Mode** - Interface moderna com tema escuro

## 📋 Como Usar

### 1. Adicionar Entregas Manualmente
O sistema já vem com 3 entregas de exemplo. Você pode visualizá-las no mapa e na lista lateral.

### 2. Importar Planilha Excel
Clique no botão **"Importar Planilha Excel"** e selecione um arquivo com as seguintes colunas:

```
| cliente | rua | numero | bairro | cidade |
|---------|-----|--------|--------|--------|
| João Silva | Rua da Paz | 120 | Centro | São Luís |
| Maria Souza | Rua Verde | 150 | Centro | São Luís |
```

### 3. Visualizar no Mapa
- Clique em "Ver rota" para focar em uma entrega
- Clique nos marcadores para ver detalhes
- Zoom e navegação livre

## 🛠️ Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Design responsivo e moderno
- **JavaScript Vanilla** - Sem dependências desnecessárias
- **Leaflet.js** - Mapas interativos
- **OpenStreetMap** - Dados de mapas (grátis)
- **Nominatim** - Geolocalização de endereços
- **XLSX.js** - Leitura de planilhas Excel

## 📱 Responsividade

- Desktop (1200px+) - Layout completo
- Tablet (900px - 1200px) - Layout adaptado
- Mobile (< 900px) - Stack vertical

## 🌍 Deploy

Este projeto é totalmente estático e pode ser deployado em:

- **GitHub Pages** (Recomendado)
- Netlify
- Vercel
- Firebase Hosting
- Qualquer servidor HTTP

### GitHub Pages (5 minutos)

1. Vá em **Settings** > **Pages**
2. Em **Source**, selecione `main` branch
3. Selecione a pasta `/` (raiz)
4. Clique **Save**

Seu site estará em: `https://leotecnologia25-web.github.io/Smart-Delivery-Map/`

## 📂 Estrutura de Arquivos

```
Smart-Delivery-Map/
├── index.html      # HTML principal
├── style.css       # Estilos CSS
├── script.js       # Lógica JavaScript
├── README.md       # Esta documentação
├── .gitignore      # Arquivos ignorados pelo Git
└── exemplo.xlsx    # Exemplo de planilha
```

## 🚀 Melhorias Futuras

- [ ] Autenticação de usuários
- [ ] Banco de dados
- [ ] Histórico de entregas
- [ ] Notificações em tempo real
- [ ] Otimização automática de rotas (TSP)
- [ ] Integração com APIs de entrega
- [ ] Modo offline

## 📞 Suporte

Para dúvidas ou problemas, abra uma [issue](https://github.com/leotecnologia25-web/Smart-Delivery-Map/issues).

## 📄 Licença

Este projeto é de código aberto e disponível sob a licença MIT.

---

**Desenvolvido com ❤️ por Leo Tecnologia**
