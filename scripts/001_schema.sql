-- BPO Financeiro - Schema completo
-- Migration 001: Criação das tabelas principais

-- 1. organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. users (perfis vinculados ao auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  cnpj TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('omie', 'conta_azul', 'nibo')),
  logo_url TEXT,
  color TEXT DEFAULT '#6c2894',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. client_credentials
CREATE TABLE IF NOT EXISTS client_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('omie', 'conta_azul', 'nibo')),
  credentials JSONB NOT NULL DEFAULT '{}',
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, platform)
);

-- 5. financial_entries
CREATE TABLE IF NOT EXISTS financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('receivable', 'payable')),
  status TEXT NOT NULL CHECK (status IN ('open', 'paid', 'overdue', 'cancelled')),
  description TEXT,
  category TEXT,
  subcategory TEXT,
  cost_center TEXT,
  person_name TEXT,
  person_document TEXT,
  issue_date DATE,
  due_date DATE NOT NULL,
  payment_date DATE,
  expected_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_value DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  interest DECIMAL(15,2) DEFAULT 0,
  fine DECIMAL(15,2) DEFAULT 0,
  bank_account TEXT,
  document_type TEXT,
  notes TEXT,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, platform, external_id)
);

-- 6. bank_accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_id TEXT,
  name TEXT NOT NULL,
  bank_name TEXT,
  current_balance DECIMAL(15,2) DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_id TEXT,
  code TEXT,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('revenue', 'expense', 'transfer')),
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. sync_logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- 9. dre_config
CREATE TABLE IF NOT EXISTS dre_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  line_order INTEGER NOT NULL,
  line_label TEXT NOT NULL,
  line_type TEXT NOT NULL CHECK (line_type IN ('revenue', 'deduction', 'cost', 'expense', 'subtotal', 'total')),
  category_codes TEXT[],
  formula TEXT,
  is_bold BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_entries_client_due ON financial_entries(client_id, due_date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_client_type_status ON financial_entries(client_id, type, status);
CREATE INDEX IF NOT EXISTS idx_financial_entries_client_category ON financial_entries(client_id, category);
CREATE INDEX IF NOT EXISTS idx_financial_entries_payment_date ON financial_entries(client_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);

-- RLS: habilitar em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dre_config ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: obtém organization_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;

-- Políticas RLS: users
CREATE POLICY "users_select_own_org" ON users
  FOR SELECT USING (organization_id = get_user_org_id() OR id = auth.uid());

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

-- Políticas RLS: organizations
CREATE POLICY "orgs_select_own" ON organizations
  FOR SELECT USING (id = get_user_org_id());

CREATE POLICY "orgs_insert_own" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orgs_update_own" ON organizations
  FOR UPDATE USING (id = get_user_org_id());

-- Políticas RLS: clients
CREATE POLICY "clients_select_own_org" ON clients
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "clients_insert_own_org" ON clients
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "clients_update_own_org" ON clients
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "clients_delete_own_org" ON clients
  FOR DELETE USING (organization_id = get_user_org_id());

-- Políticas RLS: client_credentials
CREATE POLICY "creds_select_own_org" ON client_credentials
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "creds_insert_own_org" ON client_credentials
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "creds_update_own_org" ON client_credentials
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "creds_delete_own_org" ON client_credentials
  FOR DELETE USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

-- Políticas RLS: financial_entries
CREATE POLICY "entries_select_own_org" ON financial_entries
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "entries_insert_own_org" ON financial_entries
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "entries_update_own_org" ON financial_entries
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "entries_delete_own_org" ON financial_entries
  FOR DELETE USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

-- Políticas RLS: bank_accounts
CREATE POLICY "bank_select_own_org" ON bank_accounts
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "bank_insert_own_org" ON bank_accounts
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "bank_update_own_org" ON bank_accounts
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

-- Políticas RLS: categories
CREATE POLICY "cats_select_own_org" ON categories
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "cats_insert_own_org" ON categories
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

-- Políticas RLS: sync_logs
CREATE POLICY "logs_select_own_org" ON sync_logs
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "logs_insert_own_org" ON sync_logs
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

-- Políticas RLS: dre_config
CREATE POLICY "dre_select_own_org" ON dre_config
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "dre_insert_own_org" ON dre_config
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "dre_update_own_org" ON dre_config
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "dre_delete_own_org" ON dre_config
  FOR DELETE USING (
    client_id IN (SELECT id FROM clients WHERE organization_id = get_user_org_id())
  );

-- Trigger: criar perfil de usuário automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
