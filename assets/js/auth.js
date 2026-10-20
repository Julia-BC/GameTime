/**
 * Módulo de Autenticação e Autorização (auth.js)
 */

// Retorna as informações do usuário logado e seu perfil (role)
async function getCurrentUser() {
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Busca o perfil na tabela 'profiles' para saber o papel (ADMIN ou TEEN)
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("Erro ao buscar perfil do usuário:", profileError.message);
    return null;
  }

  return { user, profile };
}

// Redireciona o usuário para a tela correta dependendo do seu papel
async function checkAuthAndRedirect() {
  const sessionData = await getCurrentUser();
  const currentPath = window.location.pathname;

  if (!sessionData) {
    // Se não estiver logado e tentar acessar dashboard ou admin, manda para o login
    if (!currentPath.endsWith('index.html') && currentPath !== '/') {
      window.location.href = 'index.html';
    }
    return;
  }

  const role = sessionData.profile.role;

  // Se for TEEN e tentar acessar tela de Admin, bloqueia no frontend
  if (role === 'TEEN' && currentPath.endsWith('admin.html')) {
    window.location.href = 'dashboard.html';
  } 
  // Se for ADMIN e estiver na tela inicial, vai direto para o painel de admin
  else if (role === 'ADMIN' && (currentPath.endsWith('index.html') || currentPath === '/')) {
    window.location.href = 'admin.html';
  } 
  // Se for TEEN e estiver na tela inicial, vai direto para a dashboard
  else if (role === 'TEEN' && (currentPath.endsWith('index.html') || currentPath === '/')) {
    window.location.href = 'dashboard.html';
  }
}

// Função para fazer logout
async function handleLogout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}