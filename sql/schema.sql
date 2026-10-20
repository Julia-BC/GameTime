-- 1. Criação da Tabela de Perfis
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('ADMIN', 'TEEN')),
  display_name VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  verification_code VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Saldo de Tempo (Wallets)
CREATE TABLE time_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  daily_balance INT DEFAULT 0,
  weekend_balance INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Tarefas
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  minutes_reward INT NOT NULL CHECK (minutes_reward > 0),
  is_mandatory BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  repeat_type VARCHAR(10) CHECK (repeat_type IN ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
  repeat_every INT DEFAULT 1 CHECK (repeat_every >= 1),
  days_of_week INT[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Conclusões de Tarefas
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Sugestões
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  proposed_minutes INT NOT NULL,
  repeat_type VARCHAR(10) CHECK (repeat_type IN ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
  repeat_every INT DEFAULT 1,
  days_of_week INT[],
  justification TEXT NOT NULL,
  status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de Transações (Extrato)
CREATE TABLE time_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount_minutes INT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('TASK_REWARD', 'WITHDRAWAL', 'ADMIN_ADJUSTMENT', 'PENALTY')),
  wallet_target VARCHAR(10) CHECK (wallet_target IN ('DAILY', 'WEEKEND')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- 1. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ========================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_transactions ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- FUNÇÃO AUXILIAR: Verifica se o usuário logado é ADMIN
-- ========================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN' ); END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- 2. POLÍTICAS DE SEGURANÇA PARA A TABELA `profiles`
-- ========================================================
-- Leitura: Qualquer usuário autenticado pode ver os perfis (Admin e Teen)
CREATE POLICY "Permitir leitura de perfis autenticados" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Atualização: O próprio usuário pode atualizar seu perfil, ou o Admin
CREATE POLICY "Permitir atualização de perfil próprio ou por Admin" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id OR is_admin());

-- ========================================================
-- 3. POLÍTICAS DE SEGURANÇA PARA A TABELA `time_wallets`
-- ========================================================
-- Leitura: Adolescente vê só a sua carteira; Admin vê todas
CREATE POLICY "Permitir leitura de carteiras" 
ON time_wallets FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR is_admin());

-- Escrita (Update/Insert): APENAS O ADMIN pode alterar saldos diretamente
CREATE POLICY "Apenas Admin pode alterar saldo da carteira" 
ON time_wallets FOR ALL 
TO authenticated 
USING (is_admin());

-- ========================================================
-- 4. POLÍTICAS DE SEGURANÇA PARA A TABELA `tasks`
-- ========================================================
-- Leitura: Todos os usuários autenticados podem ver as tarefas
CREATE POLICY "Permitir leitura de tarefas para autenticados" 
ON tasks FOR SELECT 
TO authenticated 
USING (true);

-- Criação/Edição/Deleção: APENAS O ADMIN pode gerenciar tarefas
CREATE POLICY "Apenas Admin pode gerenciar tarefas" 
ON tasks FOR ALL 
TO authenticated 
USING (is_admin());

-- ========================================================
-- 5. POLÍTICAS DE SEGURANÇA PARA A TABELA `task_completions`
-- ========================================================
-- Leitura: O adolescente vê suas conclusões; Admin vê todas
CREATE POLICY "Permitir leitura de conclusões" 
ON task_completions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR is_admin());

-- Criação: Adolescente pode registrar conclusão de tarefa
CREATE POLICY "Permitir registro de conclusão de tarefa" 
ON task_completions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Atualização/Aprovação: APENAS O ADMIN pode aprovar ou rejeitar
CREATE POLICY "Apenas Admin pode atualizar status da conclusão" 
ON task_completions FOR UPDATE 
TO authenticated 
USING (is_admin());

-- ========================================================
-- 6. POLÍTICAS DE SEGURANÇA PARA A TABELA `suggestions`
-- ========================================================
-- Leitura: Adolescente vê suas sugestões; Admin vê todas
CREATE POLICY "Permitir leitura de sugestões" 
ON suggestions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR is_admin());

-- Criação: Adolescente pode enviar sugestões
CREATE POLICY "Permitir criação de sugestões" 
ON suggestions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Atualização/Aprovação: APENAS O ADMIN pode alterar status da sugestão
CREATE POLICY "Apenas Admin pode atualizar status de sugestões" 
ON suggestions FOR UPDATE 
TO authenticated 
USING (is_admin());

-- ========================================================
-- 7. POLÍTICAS DE SEGURANÇA PARA A TABELA `time_transactions`
-- ========================================================
-- Leitura: Adolescente vê seu próprio extrato de transações; Admin vê todos
CREATE POLICY "Permitir leitura de transações" 
ON time_transactions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR is_admin());

-- Inserção: APENAS O ADMIN pode registrar transações de ajuste ou saque
CREATE POLICY "Apenas Admin pode criar transações de tempo" 
ON time_transactions FOR INSERT 
TO authenticated 
WITH CHECK (is_admin());

