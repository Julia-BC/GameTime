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