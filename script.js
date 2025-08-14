document.addEventListener('DOMContentLoaded', () => {
  mostrarDataAtual();
  carregarCardapio();
  configurarBusca();
  configurarFormularioComentarios();
  carregarComentarios();

  // Eventos administração
  document.getElementById('btn-toggle-admin').addEventListener('click', toggleAdminSection);
  document.getElementById('btn-login').addEventListener('click', loginAdmin);
});

function mostrarDataAtual() {
  const hoje = new Date();
  const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('data-hoje').textContent = hoje.toLocaleDateString('pt-BR', opcoes);
}

let alimentosGlobal = [];

async function carregarCardapio() {
  try {
    const response = await fetch('data/cardapio.json');
    if (!response.ok) throw new Error('Erro ao carregar cardápio');
    const data = await response.json();
    alimentosGlobal = data.alimentos;
    mostrarAlimentosTabela(alimentosGlobal);
  } catch (error) {
    console.error(error);
  }
}

function mostrarAlimentosTabela(alimentos) {
  const tbody = document.querySelector('#cardapio tbody');
  tbody.innerHTML = '';

  alimentos.forEach(({ nome, calorias, proteinas, carboidratos, gorduras }) => {
    const tr = document.createElement('tr');
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
  const inputBusca = document.getElementById('input-busca');
  inputBusca.addEventListener('input', () => {
    const texto = inputBusca.value.toLowerCase();
    const filtrados = alimentosGlobal.filter(item => item.nome.toLowerCase().includes(texto));
    mostrarAlimentosTabela(filtrados);
  });
}

// Comentários

function configurarFormularioComentarios() {
  const form = document.getElementById('form-comentarios');
  form.addEventListener('submit', event => {
    event.preventDefault();

    const nome = document.getElementById('input-nome').value.trim();
    const avaliacao = document.getElementById('input-avaliacao').value;
    const comentario = document.getElementById('input-comentario').value.trim();

    if (!nome || !avaliacao || !comentario) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    const novoComentario = {
      nome,
      avaliacao: parseInt(avaliacao),
      comentario,
      data: new Date().toISOString()
    };

    salvarComentario(novoComentario);
    form.reset();
    carregarComentarios();
  });
}

function salvarComentario(comentario) {
  const comentarios = JSON.parse(localStorage.getItem('comentariosNutriJardim')) || [];
  comentarios.push(comentario);
  localStorage.setItem('comentariosNutriJardim', JSON.stringify(comentarios));
}

function carregarComentarios() {
  const lista = document.getElementById('lista-comentarios');
  lista.innerHTML = '';

  const comentarios = JSON.parse(localStorage.getItem('comentariosNutriJardim')) || [];
  if (comentarios.length === 0) {
    lista.textContent = 'Nenhum comentário ainda.';
    return;
  }

  comentarios.forEach(({ nome, avaliacao, comentario, data }) => {
    const div = document.createElement('div');
    div.classList.add('comentario-item');

    const estrelas = '⭐'.repeat(avaliacao);

    const dataFormatada = new Date(data).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });

    div.innerHTML = `
      <div class="comentario-nome">${nome} - <span class="comentario-avaliacao">${estrelas}</span></div>
      <div class="comentario-texto">${comentario}</div>
      <small>${dataFormatada}</small>
    `;
    lista.appendChild(div);
  });
}

// Administração de comentários

let adminLogado = false;

function toggleAdminSection() {
  const adminSection = document.getElementById('admin-comentarios');
  adminSection.style.display = adminSection.style.display === 'none' ? 'block' : 'none';
}

function loginAdmin() {
  const senha = document.getElementById('senha-admin').value;
  if (senha === 'senha123') {  // Altere a senha aqui!
    adminLogado = true;
    alert('Logado como administrador!');
    document.getElementById('senha-admin').value = '';
    mostrarComentariosAdmin();
  } else {
    alert('Senha incorreta!');
  }
}

function mostrarComentariosAdmin() {
  if (!adminLogado) {
    alert('Você precisa estar logado para gerenciar comentários.');
    return;
  }

  const comentarios = JSON.parse(localStorage.getItem('comentariosNutriJardim')) || [];
  const container = document.getElementById('admin-lista-comentarios');
  container.innerHTML = '';

  if (comentarios.length === 0) {
    container.textContent = 'Nenhum comentário para gerenciar.';
    return;
  }

  comentarios.forEach((c, i) => {
    const div = document.createElement('div');
    div.style.background = '#dcedc8';
    div.style.marginBottom = '15px';
    div.style.padding = '15px';
    div.style.borderRadius = '10px';
    div.style.boxShadow = '0 2px 8px rgba(46,125,50,0.15)';
    div.style.position = 'relative';

    const estrelas = '⭐'.repeat(c.avaliacao);
    const dataFormatada = new Date(c.data).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });

    div.innerHTML = `
      <strong>${c.nome}</strong> - <span style="color:#ffb400;">${estrelas}</span><br>
      <small style="font-style: italic; color: #333;">${c.comentario}</small><br>
      <small style="color:#555; float:right;">${dataFormatada}</small>
      <button data-index="${i}" style="position: absolute; top: 10px; right: 10px; background: #e53935; border: none; color: white; border-radius: 6px; padding: 5px 10px; cursor: pointer;">Excluir</button>
    `;

    container.appendChild(div);
  });

  // Eventos para excluir comentários
  container.querySelectorAll('button').forEach(botao => {
    botao.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      excluirComentario(index);
    });
  });
}

function excluirComentario(index) {
  if (!adminLogado) return;

  let comentarios = JSON.parse(localStorage.getItem('comentariosNutriJardim')) || [];
  comentarios.splice(index, 1);
  localStorage.setItem('comentariosNutriJardim', JSON.stringify(comentarios));
  mostrarComentariosAdmin();
  carregarComentarios();
}
