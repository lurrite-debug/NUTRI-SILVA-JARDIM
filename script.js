document.addEventListener('DOMContentLoaded', () => {
  mostrarDataAtual();
  carregarCardapio();
  configurarBusca();
  configurarFiltros();
  configurarTema();
});

let alimentosGlobal = [];
let sortAsc = true;

function mostrarDataAtual() {
  const hoje = new Date();
  const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('data-hoje').textContent = hoje.toLocaleDateString('pt-BR', opcoes);
}

async function carregarCardapio() {
  try {
    const response = await fetch('data/cardapio.json');
    if (!response.ok) throw new Error('Erro ao carregar cardápio');
    const data = await response.json();
    alimentosGlobal = data.alimentos;
    mostrarAlimentosTabela(alimentosGlobal);
    destacarPratoDoDia();
  } catch (error) {
    console.error(error);
  }
}

function mostrarAlimentosTabela(alimentos) {
  const tbody = document.querySelector('#cardapio tbody');
  tbody.innerHTML = '';
  const feedback = document.getElementById('feedback-busca');
  if (alimentos.length === 0) {
    feedback.textContent = 'Nenhum prato encontrado 😢';
    return;
  } else feedback.textContent = '';

  alimentos.forEach(({ nome, calorias, proteinas, carboidratos, gorduras, tipo }) => {
    const tr = document.createElement('tr');
    tr.title = `Calorias: ${calorias}, Proteínas: ${proteinas}g, Carboidratos: ${carboidratos}g, Gorduras: ${gorduras}g`;
    tr.dataset.tipo = tipo || '';
    tr.innerHTML = `
      <td>${nome}</td>
      <td>${calorias}</td>
      <td>${proteinas}</td>
      <td>${carboidratos}</td>
      <td>${gorduras}</td>
    `;
    tbody.appendChild(tr);
  });
}

function configurarBusca() {
  const input = document.getElementById('input-busca');
  input.addEventListener('input', aplicarFiltros);
}

function configurarFiltros() {
  document.getElementById('filtro-calorias').addEventListener('change', aplicarFiltros);
  document.getElementById('filtro-tipo').addEventListener('change', aplicarFiltros);

  // Ordenação
  document.querySelectorAll('#cardapio th').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      alimentosGlobal.sort((a,b) => sortAsc ? a[key]-b[key] : b[key]-a[key]);
      mostrarAlimentosTabela(alimentosGlobal);
      sortAsc = !sortAsc;
    });
  });
}

function aplicarFiltros() {
  const texto = document.getElementById('input-busca').value.toLowerCase();
  const caloriasMax = parseInt(document.getElementById('filtro-calorias').value);
  const tipoFiltro = document.getElementById('filtro-tipo').value;

  let filtrados = alimentosGlobal.filter(item => item.nome.toLowerCase().includes(texto));
  if (!isNaN(caloriasMax)) filtrados = filtrados.filter(item => item.calorias <= caloriasMax);
  if (tipoFiltro) filtrados = filtrados.filter(item => item.tipo === tipoFiltro);

  mostrarAlimentosTabela(filtrados);
}

function destacarPratoDoDia() {
  const tbody = document.querySelector('#cardapio tbody');
  if (!tbody.children.length) return;
  const index = Math.floor(Math.random() * tbody.children.length);
  tbody.children[index].classList.add('prato-do-dia');
}

// Tema escuro
function configurarTema() {
  const btn = document.getElementById('btn-tema');
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    btn.textContent = document.body.classList.contains('dark-mode') ? '☀️ Tema Claro' : '🌙 Tema Escuro';
  });
}
// dssds