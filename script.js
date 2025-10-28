// script.js - versão cards, tema automático, animações e filtros
document.addEventListener('DOMContentLoaded', () => {
  mostrarDataAtual();
  configurarTemaInicial();
  carregarCardapio();
  configurarEventosUI();
});

let alimentosGlobal = [];
let pratoDoDiaIndex = 3;

function mostrarDataAtual() {
  const hoje = new Date();
  const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('data-hoje').textContent = hoje.toLocaleDateString('pt-BR', opcoes);
}

// ✅ CARREGAMENTO DO JSON (agora buscando em data/cardapio.json)
async function carregarCardapio() {
  try {
    const response = await fetch('data/cardapio.json');
    if (!response.ok) throw new Error('Erro ao carregar cardápio');
    const data = await response.json();
    alimentosGlobal = Array.isArray(data.alimentos) ? data.alimentos : [];
    aplicarFiltros(); // render inicial

  } catch (error) {
    console.error(error);
    document.getElementById('feedback-busca').textContent = 'Erro ao carregar o cardápio.';
  }
}

// RENDERIZAR CARDS
function mostrarAlimentosCards(alimentos) {
  const container = document.getElementById('cards-container');
  const feedback = document.getElementById('feedback-busca');
  container.innerHTML = '';

  if (!alimentos.length) {
    feedback.textContent = 'Nenhum prato encontrado 😢';
    return;
  } else {
    feedback.textContent = `${alimentos.length} resultado(s) encontrado(s)`;
  }

  alimentos.forEach((item, i) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.style.animationDelay = `${i * 60}ms`;

    const emoji = selecionarEmoji(item.tipo);
    const tipoLabel = item.tipo || 'Outro';

    card.innerHTML = `
      <div class="emoji" aria-hidden="true">${emoji}</div>
      <div class="info">
        <div class="nome">${escapeHtml(item.nome)}</div>
        <div class="tipo">${escapeHtml(tipoLabel)}</div>
        <div class="nutri">
          <div class="item">🔥 ${item.calorias} kcal</div>
          <div class="item">💪 ${item.proteinas} g</div>
          <div class="item">🍞 ${item.carboidratos} g</div>
          <div class="item">🥑 ${item.gorduras} g</div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  if (pratoDoDiaIndex >= 0 && container.children[pratoDoDiaIndex]) {
    container.children[pratoDoDiaIndex].classList.add('prato-do-dia');
    adicionarBadgePrato(container.children[pratoDoDiaIndex]);
  }
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function selecionarEmoji(tipo) {
  switch ((tipo || '').toLowerCase()) {
    case 'carne': return '🍖';
    case 'vegetal/fruta': return '🥦';
    case 'massa': return '🍝';
    default: return '🍽️';
  }
}

// FILTROS / ORDENAÇÃO
function aplicarFiltros() {
  const texto = document.getElementById('input-busca').value.trim().toLowerCase();
  const caloriasMax = parseInt(document.getElementById('filtro-calorias').value);
  const tipoFiltro = document.getElementById('filtro-tipo').value;
  const sortBy = document.getElementById('sort-by').value;

  let filtrados = alimentosGlobal.filter(item => item.nome.toLowerCase().includes(texto));
  if (!isNaN(caloriasMax)) filtrados = filtrados.filter(item => item.calorias <= caloriasMax);
  if (tipoFiltro) filtrados = filtrados.filter(item => item.tipo === tipoFiltro);

  if (sortBy === 'nome') {
    filtrados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  } else if (sortBy === 'calorias') {
    filtrados.sort((a, b) => a.calorias - b.calorias);
  }

  mostrarAlimentosCards(filtrados);
}

// DESTAQUE PRATO DO DIA
function destacarPratoDoDia() {
  if (!alimentosGlobal.length) return;
  pratoDoDiaIndex = Math.floor(Math.random() * alimentosGlobal.length);
  aplicarFiltros();

  setTimeout(() => {
    const container = document.getElementById('cards-container');
    const alvoNome = alimentosGlobal[pratoDoDiaIndex].nome;
    const target = Array.from(container.children)
      .find(c => c.querySelector('.nome')?.textContent === alvoNome);
    if (target) {
      target.classList.add('prato-do-dia');
      adicionarBadgePrato(target);
    }
  }, 120);
}

function adicionarBadgePrato(cardElement) {
  if (!cardElement || cardElement.querySelector('.prato-badge')) return;
  const badge = document.createElement('div');
  badge.className = 'prato-badge';
  badge.textContent = 'PRATO DO DIA';
  cardElement.appendChild(badge);
}

// 🌗 TEMA: automático + botão manual + persistência
function configurarTemaInicial() {
  const saved = localStorage.getItem('nj-theme'); // 'dark' | 'light'
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) document.body.classList.add('dark-mode');
  updateTemaBtn();

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      const savedNow = localStorage.getItem('nj-theme');
      if (!savedNow) {
        if (e.matches) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        updateTemaBtn();
      }
    });
  }
}

function configurarEventosUI() {
  document.getElementById('input-busca').addEventListener('input', debounce(aplicarFiltros, 180));
  document.getElementById('filtro-calorias').addEventListener('change', aplicarFiltros);
  document.getElementById('filtro-tipo').addEventListener('change', aplicarFiltros);
  document.getElementById('sort-by').addEventListener('change', aplicarFiltros);

  const btnTema = document.getElementById('btn-tema');
  btnTema.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('nj-theme', isDark ? 'dark' : 'light');
    updateTemaBtn();
  });
}

function updateTemaBtn() {
  const btn = document.getElementById('btn-tema');
  if (!btn) return;
  const isDark = document.body.classList.contains('dark-mode');
  btn.textContent = isDark ? '☀️ Tema Claro' : '🌙 Tema Escuro';
  btn.setAttribute('aria-pressed', String(isDark));
}

// debounce helper
function debounce(fn, wait = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}
