/**
 * ACHIEVEMENTS.JS — Lógica de Sequência (Streak) e Conquistas do Jogador
 */

document.addEventListener('DOMContentLoaded', async () => {
  const sessionData = await getCurrentUser();
  if (!sessionData) return;

  const { profile } = sessionData;
  if (profile) {
    loadUserAchievements(profile);
  }
});

function loadUserAchievements(profile) {
  // 1. Define a variável streakDays com segurança a partir do perfil
  const streakDays = profile.streak_days || 0;

  // Atualiza o Streak (Sequência de dias) no DOM
  const streakText = document.getElementById('streak-text');
  if (streakText) {
    streakText.textContent = `${streakDays} ${streakDays === 1 ? 'dia de sequência' : 'dias de sequência'}`;
  }

  // 2. Renderiza as Conquistas / Badges
  const badgesContainer = document.getElementById('badges-container');
  if (!badgesContainer) return; // Proteção caso o elemento não exista

  badgesContainer.innerHTML = '';

  const userLevel = profile.level || 1;
  const userXp = profile.xp || 0;

  const badges = [
    {
      title: '🥇 Mestre da Manhã',
      description: 'Completou a primeira tarefa do dia.',
      unlocked: userXp > 0
    },
    {
      title: '+ Valor',
      description: 'Alcançou o nível 3 no sistema.',
      unlocked: userLevel >= 3
    },
    {
      title: '🔥 Foco Total',
      description: 'Manteve 3 dias seguidos de sequência.',
      unlocked: streakDays >= 3
    }
  ];

  badges.forEach(badge => {
    const badgeEl = document.createElement('div');
    badgeEl.className = `badge-item ${badge.unlocked ? 'unlocked' : ''}`;
    badgeEl.title = badge.description;
    badgeEl.textContent = badge.title;
    
    badgesContainer.appendChild(badgeEl);
  });
}