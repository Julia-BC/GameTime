/**
 * TASKS.JS — Gestão, listagem e conclusão de tarefas do Jogador
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Aguarda carregar a sessão e o usuário do auth.js
  const sessionData = await getCurrentUser();
  if (!sessionData) return;

  const userId = sessionData.user.id;

  // Carrega as tarefas do banco
  await loadUserTasks(userId);
});

async function loadUserTasks(userId) {
  const container = document.getElementById('tasks-container');
  container.innerHTML = '<p class="loading-tasks">Buscando missões...</p>';

  // 1. Busca todas as tarefas cadastradas no sistema
  const { data: tasks, error: tasksError } = await supabaseClient
    .from('tasks')
    .select('*');

  if (tasksError) {
    console.error("Erro ao carregar tarefas:", tasksError.message);
    container.innerHTML = '<p class="error-tasks">Erro ao carregar missões.</p>';
    return;
  }

  // 2. Busca o status de conclusão do usuário logado para cruzar os dados
  const { data: completions, error: compError } = await supabaseClient
    .from('task_completions')
    .select('*')
    .eq('user_id', userId);

  if (compError) {
    console.error("Erro ao carregar conclusões:", compError.message);
  }

  // Mapeia as conclusões por task_id para fácil consulta
  const completionMap = {};
  if (completions) {
    completions.forEach(comp => {
      completionMap[comp.task_id] = comp.status; // PENDING, APPROVED, REJECTED
    });
  }

  renderTasksList(tasks, completionMap, userId);
}

function renderTasksList(tasks, completionMap, userId) {
  const container = document.getElementById('tasks-container');
  container.innerHTML = '';

  let pendingCount = 0;
  let completedCount = 0;
  let rejectedCount = 0;

  if (!tasks || tasks.length === 0) {
    container.innerHTML = '<p class="no-tasks">Nenhuma missão cadastrada para hoje.</p>';
    updateCounters(0, 0, 0);
    return;
  }

  tasks.forEach(task => {
    const status = completionMap[task.id]; // undefined, PENDING, APPROVED, REJECTED
    const isMandatory = task.is_mandatory;

    // Atualiza contadores
    if (status === 'APPROVED') completedCount++;
    else if (status === 'REJECTED') rejectedCount++;
    else pendingCount++;

    const card = document.createElement('div');
    card.className = `task-card ${status === 'APPROVED' ? 'completed' : ''}`;

    let actionButtonHTML = '';

    if (status === 'APPROVED') {
      actionButtonHTML = `<span class="task-status-text">✅ Concluída</span>`;
    } else if (status === 'PENDING') {
      actionButtonHTML = `<span class="task-status-text pending">⏳ Em análise</span>`;
    } else {
      actionButtonHTML = `<button class="btn-complete" onclick="completeTask('${task.id}', '${userId}')">Concluir</button>`;
    }

    card.innerHTML = `
      <div class="task-info">
        <span class="task-badge ${isMandatory ? 'mandatory' : 'optional'}" title="${isMandatory ? 'Obrigatória' : 'Opcional'}">
          ${isMandatory ? '⚠️' : '⭐'}
        </span>
        <div>
          <h3 class="task-title">${task.title}</h3>
          <span class="task-reward">+${task.time_reward_minutes} min / +${task.xp_reward} XP</span>
        </div>
      </div>
      ${actionButtonHTML}
    `;

    container.appendChild(card);
  });

  updateCounters(pendingCount, completedCount, rejectedCount);
}

function updateCounters(pending, completed, rejected) {
  const pEl = document.getElementById('counter-pending');
  const cEl = document.getElementById('counter-completed');
  const rEl = document.getElementById('counter-rejected');

  if (pEl) pEl.textContent = `◯ ${pending} Pendentes`;
  if (cEl) cEl.textContent = `✓ ${completed} Concluídas`;
  if (rEl) rEl.textContent = `✕ ${rejected} Rejeitadas`;
}

// Função executada quando o adolescente clica em concluir tarefa
async function completeTask(taskId, userId) {
  const { error } = await supabaseClient
    .from('task_completions')
    .insert([
      {
        user_id: userId,
        task_id: taskId,
        status: 'PENDING' // Envia como pendente para aprovação do Admin
      }
    ]);

  if (error) {
    alert("Erro ao registrar conclusão: " + error.message);
  } else {
    // Recarrega a lista de tarefas para atualizar a tela
    loadUserTasks(userId);
  }
}