// Novo script.js - semanal vertical com pratos lado-a-lado e badge ao lado do título
document.addEventListener('DOMContentLoaded', () => {
  mostrarDataAtual();
  configurarTemaInicial();
  carregarCardapio();
  configurarEventosUI();
});

let cardapioSemana = {};
const diasOrdem = ['segunda','terca','quarta','quinta','sexta'];
const diasDisplay = {
  segunda: 'Segunda-feira',
  terca:  'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta:  'Sexta-feira'
};

function mostrarDataAtual() {
  const hoje = new Date();
  const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('data-hoje').textContent = hoje.toLocaleDateString('pt-BR', opcoes);
}

// Carregar o JSON semanal: data/cardapio.json
async function carregarCardapio() {
  try {
    const response = await fetch('data/cardapio.json');
    if (!response.ok) throw new Error('Erro ao carregar cardápio');
    const data = await response.json();
    cardapioSemana = data.semana || {};
    renderizarSemana(); // gera toda a semana
  } catch (error) {
    console.error(error);
    document.getElementById('feedback-busca').textContent = 'Erro ao carregar o cardápio.';
  }
}

// Obtém o "dia atual de cardápio": seg/ter/qua/qui/sex, sáb/dom => sexta
function diaAtualChave() {
  const hoje = new Date();
  const idx = hoje.getDay(); // 0 domingo ... 6 sábado
  switch(idx) {
    case 0: return 'sexta'; // domingo -> mostrar sexta
    case 6: return 'sexta'; // sabado -> mostrar sexta
    case 1: return 'segunda';
    case 2: return 'terca';
    case 3: return 'quarta';
    case 4: return 'quinta';
    case 5: return 'sexta';
    default: return 'segunda';
  }
}

// Renderiza toda a semana verticalmente, cada dia com grid de cards (side-by-side)
function renderizarSemana() {
  const container = document.getElementById('semana-container');
  container.innerHTML = '';

  const hojeChave = diaAtualChave();

  // prepara filtros atuais
  const textoBusca = document.getElementById('input-busca').value.trim().toLowerCase();
  const caloriasMax = parseInt(document.getElementById('filtro-calorias').value);
  const tipoFiltro = document.getElementById('filtro-tipo').value;
  const sortBy = document.getElementById('sort-by').value;

  let totalEncontrados = 0;

  diasOrdem.forEach(diaKey => {
    const diaSec = document.createElement('section');
    diaSec.className = 'section-dia';

    // cabeçalho do dia: titulo + (badge se for dia atual)
    const headerRow = document.createElement('div');
    headerRow.className = 'dia-semana-row';

    const titulo = document.createElement('h2');
    titulo.className = 'dia-semana';
    titulo.textContent = diasDisplay[diaKey] || diaKey;

    headerRow.appendChild(titulo);

    if (diaKey === hojeChave) {
      const badge = document.createElement('span');
      badge.className = 'dia-badge';
      badge.textContent = 'PRATO DO DIA';
      headerRow.appendChild(badge);
    }

    diaSec.appendChild(headerRow);

    // container de cards para este dia (usa mesma classe .cards-container)
    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'cards-container';

    const lista = Array.isArray(cardapioSemana[diaKey]) ? cardapioSemana[diaKey] : [];

    // aplicar filtros no conteúdo deste dia
    let filtrados = lista.filter(item => {
      if (!item || !item.nome) return false;
      const matchesTexto = item.nome.toLowerCase().includes(textoBusca);
      if (!matchesTexto) return false;
      if (!isNaN(caloriasMax)) {
        if (typeof item.calorias === 'number') {
          if (item.calorias > caloriasMax) return false;
        } else {
          // tenta converter string
          const c = parseInt(item.calorias);
          if (!isNaN(c) && c > caloriasMax) return false;
        }
      }
      if (tipoFiltro) {
        if ((item.tipo || '') !== tipoFiltro) return false;
      }
      return true;
    });

    // ordenação
    if (sortBy === 'nome') {
      filtrados.sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    } else if (sortBy === 'calorias') {
      filtrados.sort((a,b) => (a.calorias || 0) - (b.calorias || 0));
    }

    // gerar cards lado a lado (mesmo markup que antes)
    filtrados.forEach((item, i) => {
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
            <div class="item">🔥 ${item.calorias ?? 0} kcal</div>
            <div class="item">💪 ${item.proteinas ?? 0} g</div>
            <div class="item">🍞 ${item.carboidratos ?? 0} g</div>
            <div class="item">🥑 ${item.gorduras ?? 0} g</div>
          </div>
        </div>
      `;
      cardsWrap.appendChild(card);
    });

    totalEncontrados += filtrados.length;

    // se não tiver itens (após filtro) mostramos um cardzinho de aviso dentro da seção
    if (filtrados.length === 0) {
      const aviso = document.createElement('div');
      aviso.style.color = '#b91c1c';
      aviso.style.fontWeight = '700';
      aviso.style.padding = '10px 6px';
      aviso.textContent = 'Nenhum prato encontrado para este dia.';
      cardsWrap.appendChild(aviso);
    }

    diaSec.appendChild(cardsWrap);
    container.appendChild(diaSec);
  });

  // feedback geral
  const feedback = document.getElementById('feedback-busca');
  feedback.textContent = `${totalEncontrados} resultado(s) encontrado(s)`;
}

// emoji por tipo
function selecionarEmoji(tipo = '') {
  switch ((tipo || '').toLowerCase()) {
    case 'mistura': return '🍖';
    case 'vegetal': return '🥦';
    case 'fruta': return '🍎';
    case 'massa': return '🍝';
    default: return '🍽️';
  }
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s] ));
}

// Eventos: filtros, busca, ordenação, tema
function configurarEventosUI() {
  document.getElementById('input-busca').addEventListener('input', debounce(renderizarSemana, 160));
  document.getElementById('filtro-calorias').addEventListener('change', renderizarSemana);
  document.getElementById('filtro-tipo').addEventListener('change', renderizarSemana);
  document.getElementById('sort-by').addEventListener('change', renderizarSemana);

  const btnTema = document.getElementById('btn-tema');
  btnTema.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('nj-theme', isDark ? 'dark' : 'light');
    updateTemaBtn();
  });
}

function debounce(fn, wait = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// Tema: mantém o comportamento anterior
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

function updateTemaBtn() {
  const btn = document.getElementById('btn-tema');
  if (!btn) return;
  const isDark = document.body.classList.contains('dark-mode');
  btn.textContent = isDark ? '☀️ Tema Claro' : '🌙 Tema Escuro';
  btn.setAttribute('aria-pressed', String(isDark));
}
