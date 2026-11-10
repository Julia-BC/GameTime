/**
 * DASHBOARD.JS — Lógica e carregamento de dados do Jogador
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verifica autenticação e pega dados do usuário
  const sessionData = await getCurrentUser();
  
  if (!sessionData) {
    window.location.href = 'index.html';
    return;
  }

  const { profile } = sessionData;

  // 2. Atualiza os elementos visuais do Header com os dados reais do banco
  if (profile) {
    updatePlayerHeader(profile);
  }
});

function updatePlayerHeader(profile) {
  // Elementos do DOM
  const avatarImg = document.getElementById('player-avatar');
  const levelText = document.getElementById('player-level-text');
  const xpBarFill = document.getElementById('xp-bar-fill');
  const xpText = document.getElementById('xp-text');

  // Avatar (Protegido contra elemento nulo)
  if (avatarImg) {
    if (profile.avatar_url) {
      avatarImg.src = profile.avatar_url;
    } else {
      avatarImg.src = 'assets/images/logo_gametime.png'; // Avatar padrão
    }
  }

  // Nível do Jogador
  const level = profile.level || 1;
  if (levelText) {
    levelText.textContent = `N${level} — Guardião do Tempo`;
  }

  // Lógica da Barra de XP
  const currentXp = profile.xp || 0;
  const xpNeededForNextLevel = level * 200; 
  const xpPercentage = Math.min(Math.floor((currentXp / xpNeededForNextLevel) * 100), 100);

  // Aplica largura na barra de XP e texto descritivo com segurança
  if (xpBarFill) {
    xpBarFill.style.width = `${xpPercentage}%`;
  }
  if (xpText) {
    xpText.textContent = `${currentXp} / ${xpNeededForNextLevel} XP`;
  }
}