/**
 * WALLET.JS — Gestão de Saldo de Tempo e Saques do Jogador
 */

document.addEventListener('DOMContentLoaded', async () => {
  const sessionData = await getCurrentUser();
  if (!sessionData) return;

  const userId = sessionData.user.id;
  await loadUserWallet(userId);
});

async function loadUserWallet(userId) {
  const timerDisplay = document.getElementById('timer-display');
  
  // Proteção caso o elemento não exista na página
  if (timerDisplay) {
    timerDisplay.textContent = "Carregando...";
  }

  // Busca o saldo de tempo na tabela 'time_wallets'
  const { data: wallet, error } = await supabaseClient
    .from('time_wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error("Erro ao carregar carteira de tempo:", error.message);
    if (timerDisplay) timerDisplay.textContent = "00:00";
    return;
  }

  if (timerDisplay) {
    if (wallet) {
      // Exibe o saldo diário (ou a soma, dependendo da regra escolhida)
      const totalMinutes = wallet.daily_balance || 0;
      timerDisplay.textContent = formatMinutesToHours(totalMinutes);
    } else {
      timerDisplay.textContent = "00:00";
    }
  }
}

// Função auxiliar para converter minutos em formato "01:30"
function formatMinutesToHours(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}`;
}

// Função de Saque de Tempo
async function withdrawTime(type) {
  const sessionData = await getCurrentUser();
  if (!sessionData) return;
  const userId = sessionData.user.id;

  // Exemplo simples de saque (subtrai 30 minutos por exemplo)
  const amountToWithdraw = 30; 

  const { data: wallet, error: fetchError } = await supabaseClient
    .from('time_wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError || !wallet) {
    alert("Erro ao consultar saldo.");
    return;
  }

  const currentBalance = type === 'daily' ? wallet.daily_balance : wallet.weekend_balance;

  if (currentBalance < amountToWithdraw) {
    alert("Saldo insuficiente para saque!");
    return;
  }

  const newBalance = currentBalance - amountToWithdraw;
  const updateField = type === 'daily' ? { daily_balance: newBalance } : { weekend_balance: newBalance };

  // Atualiza no Supabase
  const { error: updateError } = await supabaseClient
    .from('time_wallets')
    .update(updateField)
    .eq('user_id', userId);

  if (updateError) {
    alert("Erro ao realizar saque: " + updateError.message);
  } else {
    alert(`Saque de ${amountToWithdraw} minutos realizado com sucesso!`);
    loadUserWallet(userId); // Recarrega o timer na tela
  }
}