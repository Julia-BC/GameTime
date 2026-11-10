/**
 * ADMIN.JS — Lógica do Painel do Administrador (Monitoramento, Notificações e Controle)
 */

let selectedDifficulty = 'Fácil';

document.addEventListener('DOMContentLoaded', async () => {
  const sessionData = await getCurrentUser();
  if (!sessionData) return;

  if (sessionData.profile.role !== 'ADMIN') {
    alert("Acesso restrito a administradores!");
    window.location.href = 'dashboard.html';
    return;
  }

  await loadMonitoringTasks();
  await loadPendingNotifications();
  await loadAdminTasksList();
});

// Seleção de Dificuldade no formulário
function setDifficulty(diff, btnElement) {
  selectedDifficulty = diff;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');
}

// Seleção de dias da semana
function toggleDay(btnElement) {
  btnElement.classList.toggle('active');
}

// Abrir / Fechar Modal de Notificações
function toggleNotificationsModal() {
  const modal = document.getElementById('notifications-modal');
  if (modal) {
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
  }
}

// Abrir / Fechar Modal de Criação de Tarefa
function toggleTaskModal(open) {
  const modal = document.getElementById('task-modal');
  if (modal) {
    modal.style.display = open ? 'flex' : 'none';
  }
}

// 1. Carregar Monitoramento de Tarefas de Hoje
async function loadMonitoringTasks() {
  const container = document.getElementById('monitor-tasks-container');
  if (!container) return;
  
  container.innerHTML = '<p class="loading-text">Carregando...</p>';

  const { data: tasks, error } = await supabaseClient
    .from('tasks')
    .select('*');

  if (error) {
    container.innerHTML = '<p class="error-text">Erro ao carregar.</p>';
    return;
  }

  if (!tasks || tasks.length === 0) {
    container.innerHTML = '<p class="empty-text">Nenhuma tarefa cadastrada.</p>';
    updateMonitoringCounters(0, 0, 0);
    return;
  }

  container.innerHTML = '';
  let pendingCount = 0;
  let completedCount = 0;
  let rejectedCount = 0;

  tasks.forEach(task => {
    pendingCount++;
    const item = document.createElement('div');
    item.className = 'monitor-task-item';
    item.innerHTML = `
      <span>⚠️ ${task.title}</span>
      <span>${task.xp_reward || 15} XP</span>
    `;
    container.appendChild(item);
  });

  updateMonitoringCounters(pendingCount, completedCount, rejectedCount);
}

function updateMonitoringCounters(p, c, r) {
  const pEl = document.getElementById('m-pending');
  const cEl = document.getElementById('m-completed');
  const rEl = document.getElementById('m-rejected');

  if (pEl) pEl.textContent = `◯ ${p}`;
  if (cEl) cEl.textContent = `✓ ${c}`;
  if (rEl) rEl.textContent = `✕ ${r}`;
}

// 2. Carregar Notificações / Aprovações Pendentes
async function loadPendingNotifications() {
  const modalContainer = document.getElementById('modal-pending-container');
  const badge = document.getElementById('notification-badge');
  
  if (!modalContainer) return;
  modalContainer.innerHTML = '<p class="loading-text">Buscando aprovações...</p>';

  const { data: completions, error } = await supabaseClient
    .from('task_completions')
    .select(`
      id,
      status,
      tasks (title, xp_reward, time_reward_minutes),
      profiles (display_name)
    `)
    .eq('status', 'PENDING');

  if (error) {
    modalContainer.innerHTML = '<p class="error-text">Erro ao carregar notificações.</p>';
    if (badge) badge.textContent = '0';
    return;
  }

  if (!completions || completions.length === 0) {
    modalContainer.innerHTML = '<p class="empty-text">Nenhuma notificação de aprovação pendente.</p>';
    if (badge) badge.textContent = '0';
    return;
  }

  if (badge) badge.textContent = completions.length;
  modalContainer.innerHTML = '';

  completions.forEach(comp => {
    const card = document.createElement('div');
    card.className = 'approval-card-modal';
    card.innerHTML = `
      <div>
        <strong>${comp.profiles?.display_name || 'Usuário'}</strong> solicitou aprovação para:<br>
        <em>"${comp.tasks?.title || 'Tarefa'}"</em> (+${comp.tasks?.xp_reward || 0} XP)
      </div>
      <div class="approval-actions-modal">
        <button class="btn-action-mod btn-mod-adjust" onclick="handleActionModal('${comp.id}', 'ADJUST')">Ajustar</button>
        <button class="btn-action-mod btn-mod-deny" onclick="handleActionModal('${comp.id}', 'REJECTED')">Negar</button>
        <button class="btn-action-mod btn-mod-accept" onclick="handleActionModal('${comp.id}', 'APPROVED')">Aceitar</button>
      </div>
    `;
    modalContainer.appendChild(card);
  });
}

async function handleActionModal(completionId, action) {
  if (action === 'ADJUST') {
    alert("Função de ajuste manual em desenvolvimento.");
    return;
  }

  const newStatus = action === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  const { error } = await supabaseClient
    .from('task_completions')
    .update({ status: newStatus })
    .eq('id', completionId);

  if (error) {
    alert("Erro ao processar: " + error.message);
  } else {
    alert(`Solicitação ${newStatus === 'APPROVED' ? 'aceita' : 'negada'}!`);
    loadPendingNotifications();
  }
}

// 3. Carregar Lista de Tarefas no Painel de Controle
async function loadAdminTasksList() {
  const container = document.getElementById('admin-tasks-container');
  if (!container) return;

  container.innerHTML = '<p class="loading-text">Carregando tarefas...</p>';

  const { data: tasks, error } = await supabaseClient
    .from('tasks')
    .select('*');

  if (error) {
    container.innerHTML = '<p class="error-text">Erro ao carregar tarefas.</p>';
    return;
  }

  if (!tasks || tasks.length === 0) {
    container.innerHTML = '<p class="empty-text">Nenhuma tarefa cadastrada.</p>';
    return;
  }

  container.innerHTML = '';
  tasks.forEach(task => {
    const item = document.createElement('div');
    item.className = 'admin-task-manage-item';
    item.innerHTML = `
      <div>
        <strong>${task.title}</strong><br>
        <small>${task.difficulty || 'Fácil'} | +${task.xp_reward} XP</small>
      </div>
      <span class="badge-count" style="background: ${task.is_mandatory ? '#C62828' : '#2E7D32'}">
        ${task.is_mandatory ? 'Obrigatória' : 'Opcional'}
      </span>
    `;
    container.appendChild(item);
  });
}

// 4. Criar Nova Tarefa via Modal do Painel de Controle
async function handleCreateTask(event) {
  event.preventDefault();

  const title = document.getElementById('task-name').value;
  const description = document.getElementById('task-desc').value;
  const xpReward = parseInt(document.getElementById('task-xp').value) || 30;
  const isMandatory = document.getElementById('task-mandatory').checked;
  const tag = document.getElementById('task-tag').value;

  const { error } = await supabaseClient
    .from('tasks')
    .insert([
      {
        title: title,
        description: description,
        xp_reward: xpReward,
        minutes_reward: 30, // Padrão
        is_mandatory: isMandatory,
        difficulty: selectedDifficulty,
        tag: tag
      }
    ]);

  if (error) {
    alert("Erro ao criar tarefa: " + error.message);
  } else {
    alert("Tarefa criada com sucesso!");
    document.getElementById('task-control-form').reset();
    toggleTaskModal(false); // Fecha o modal
    loadMonitoringTasks();
    loadAdminTasksList(); // Atualiza a listagem de controle
  }
}