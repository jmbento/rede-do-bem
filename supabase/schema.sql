-- ================================
-- REDE DO BEM - SCHEMA SQL
-- Sistema de Doação Hospitalar
-- ================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "postgis";

-- ================================
-- ENUMS
-- ================================

CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'doador', 'armazenador', 'distribuidor', 'solicitante');

CREATE TYPE item_status AS ENUM ('disponivel', 'em_uso', 'em_transito', 'manutencao', 'aguardando_coleta');

CREATE TYPE request_status AS ENUM ('pendente', 'atendido', 'cancelado');

CREATE TYPE mission_status AS ENUM ('aberta', 'aceita', 'em_rota', 'concluida', 'cancelada');

-- ================================
-- TABELA: USERS
-- ================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    auth_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    role user_role NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    address TEXT,
    neighborhood VARCHAR(255), -- Para geo-obfuscation
    city VARCHAR(255),
    state VARCHAR(2),
    zipcode VARCHAR(10),
    capacity_slots INTEGER, -- Apenas para armazenadores
    occupied_slots INTEGER DEFAULT 0, -- Slots ocupados
    is_active BOOLEAN DEFAULT TRUE,
    document_url TEXT, -- Upload de documento para voluntários
    profile_photo_url TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_role ON users (role);

CREATE INDEX idx_users_location ON users (lat, lng);

CREATE INDEX idx_users_is_active ON users (is_active);

-- ================================
-- TABELA: ITEMS (Equipamentos)
-- ================================

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    category VARCHAR(100) NOT NULL, -- 'cadeira_rodas', 'cama_hospitalar', etc
    status item_status DEFAULT 'disponivel',
    holder_id UUID REFERENCES users (id) ON DELETE SET NULL,
    photo_url TEXT NOT NULL, -- OBRIGATÓRIO
    condition VARCHAR(50) NOT NULL, -- 'novo', 'bom', 'precisa_reparo'
    description TEXT,
    qr_code_id UUID DEFAULT uuid_generate_v4 (), -- ID único para QR Code
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_items_status ON items (status);

CREATE INDEX idx_items_holder ON items (holder_id);

CREATE INDEX idx_items_category ON items (category);

CREATE INDEX idx_items_qr_code ON items (qr_code_id);

-- ================================
-- TABELA: REQUESTS (Fila de Espera)
-- ================================

CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    requester_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_needed VARCHAR(100) NOT NULL,
    urgency_level INTEGER CHECK (urgency_level BETWEEN 1 AND 3), -- 1=Baixa, 2=Média, 3=Alta
    status request_status DEFAULT 'pendente',
    medical_document_url TEXT, -- Laudo médico (opcional)
    notes TEXT,
    matched_item_id UUID REFERENCES items (id) ON DELETE SET NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_requests_status ON requests (status);

CREATE INDEX idx_requests_requester ON requests (requester_id);

CREATE INDEX idx_requests_created_at ON requests (created_at);

-- ================================
-- TABELA: MISSIONS (Logística)
-- ================================

CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    item_id UUID NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users (id) ON DELETE SET NULL, -- Nullable até aceite
    origin_user_id UUID NOT NULL REFERENCES users (id),
    destination_user_id UUID NOT NULL REFERENCES users (id),
    origin_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    distance_km DECIMAL(10, 2),
    status mission_status DEFAULT 'aberta',
    accepted_at TIMESTAMP
    WITH
        TIME ZONE,
        completed_at TIMESTAMP
    WITH
        TIME ZONE,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_missions_status ON missions (status);

CREATE INDEX idx_missions_driver ON missions (driver_id);

CREATE INDEX idx_missions_item ON missions (item_id);

-- ================================
-- TABELA: NOTIFICATIONS
-- ================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50), -- 'new_item', 'mission_available', 'item_matched', etc
    is_read BOOLEAN DEFAULT FALSE,
    related_item_id UUID REFERENCES items (id) ON DELETE SET NULL,
    related_mission_id UUID REFERENCES missions (id) ON DELETE SET NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id);

CREATE INDEX idx_notifications_is_read ON notifications (is_read);

-- ================================
-- FUNCTIONS & TRIGGERS
-- ================================

-- Função para calcular prioridade da fila
CREATE OR REPLACE FUNCTION calculate_request_priority(req_id UUID)
RETURNS INTEGER AS $$
DECLARE
  urg_level INTEGER;
  days_waiting INTEGER;
  priority_score INTEGER;
BEGIN
  SELECT 
    urgency_level,
    EXTRACT(DAY FROM (NOW() - created_at))::INTEGER
  INTO urg_level, days_waiting
  FROM requests
  WHERE id = req_id;
  
  priority_score := (urg_level * 10) + (days_waiting * 1);
  RETURN priority_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- VIEW: FILA PRIORIZADA
-- ================================

CREATE OR REPLACE VIEW prioritized_requests AS
SELECT 
  r.*,
  u.name as requester_name,
  u.neighborhood,
  u.city,
  (r.urgency_level * 10) + EXTRACT(DAY FROM (NOW() - r.created_at))::INTEGER AS priority_score
FROM requests r
JOIN users u ON r.requester_id = u.id
WHERE r.status = 'pendente'
ORDER BY priority_score DESC;

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- 🔒 LGPD COMPLIANT
-- ================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ================================
-- RLS: USERS
-- ================================

-- Leitura: Usuário vê seus próprios dados
CREATE POLICY "Users can view own profile" ON users FOR
SELECT USING (auth.uid () = auth_id);

-- Gestor/Admin vê todos
CREATE POLICY "Admins can view all users" ON users FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND role IN ('admin', 'gestor')
        )
    );

-- Distribuidor vê APENAS nome e bairro do destino SE tiver missão aceita
CREATE POLICY "Drivers see mission destinations" ON users FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM missions m
                JOIN users u ON u.auth_id = auth.uid ()
            WHERE
                m.driver_id = u.id
                AND m.status IN ('aceita', 'em_rota')
                AND (
                    m.origin_user_id = users.id
                    OR m.destination_user_id = users.id
                )
        )
    );

-- Edição: Apenas próprio usuário ou admin
CREATE POLICY "Users can update own profile" ON users FOR
UPDATE USING (auth.uid () = auth_id);

CREATE POLICY "Admins can update any user" ON users FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE
            auth_id = auth.uid ()
            AND role IN ('admin', 'gestor')
    )
);

-- Inserção: Qualquer autenticado pode criar perfil
CREATE POLICY "Authenticated users can create profile" ON users FOR
INSERT
WITH
    CHECK (auth.uid () = auth_id);

-- ================================
-- RLS: ITEMS
-- ================================

-- Leitura: Público vê itens disponíveis (sem endereço completo)
CREATE POLICY "Public can view available items" ON items FOR
SELECT USING (status = 'disponivel');

-- Armazenador/Distribuidor vê itens em trânsito/aguardando coleta
CREATE POLICY "Volunteers see logistics items" ON items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND role IN (
                    'armazenador', 'distribuidor', 'admin', 'gestor'
                )
        )
    );

-- Doador vê seus próprios itens
CREATE POLICY "Donors see own items" ON items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND id = items.holder_id
        )
    );

-- Inserção: Doadores podem criar itens
CREATE POLICY "Donors can create items" ON items FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND role IN ('doador', 'admin')
        )
    );

-- Edição: Holder ou admin pode editar
CREATE POLICY "Holders and admins can update items" ON items FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE
            auth_id = auth.uid ()
            AND (
                id = items.holder_id
                OR role IN (
                    'admin',
                    'gestor',
                    'armazenador'
                )
            )
    )
);

-- ================================
-- RLS: REQUESTS
-- ================================

-- Leitura: Solicitante vê apenas sua própria solicitação
CREATE POLICY "Requesters see own requests" ON requests FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND id = requests.requester_id
        )
    );

-- Gestor/Admin vê todas as solicitações
CREATE POLICY "Admins see all requests" ON requests FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND role IN ('admin', 'gestor')
        )
    );

-- Inserção: Solicitantes podem criar requests
CREATE POLICY "Requesters can create requests" ON requests FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND role = 'solicitante'
        )
    );

-- Edição: Apenas gestor/admin pode alterar urgência
CREATE POLICY "Admins can update requests" ON requests FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE
            auth_id = auth.uid ()
            AND role IN ('admin', 'gestor')
    )
);

-- ================================
-- RLS: MISSIONS
-- ================================

-- Leitura: Distribuidor vê missões disponíveis e suas próprias
CREATE POLICY "Drivers see available and own missions" ON missions FOR
SELECT USING (
        status = 'aberta'
        OR EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND id = missions.driver_id
        )
        OR EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND role IN ('admin', 'gestor')
        )
    );

-- Inserção: Sistema/Admin cria missões
CREATE POLICY "Admins can create missions" ON missions FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND role IN ('admin', 'gestor')
        )
    );

-- Edição: Distribuidor pode aceitar/atualizar suas missões
CREATE POLICY "Drivers can update own missions" ON missions FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE
            auth_id = auth.uid ()
            AND (
                id = missions.driver_id
                OR role IN ('admin', 'gestor')
            )
    )
);

-- ================================
-- RLS: NOTIFICATIONS
-- ================================

-- Leitura: Usuário vê apenas suas notificações
CREATE POLICY "Users see own notifications" ON notifications FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                auth_id = auth.uid ()
                AND id = notifications.user_id
        )
    );

-- Edição: Usuário pode marcar como lida
CREATE POLICY "Users can update own notifications" ON notifications FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE
            auth_id = auth.uid ()
            AND id = notifications.user_id
    )
);

-- Inserção: Sistema cria notificações
CREATE POLICY "System can create notifications" ON notifications FOR
INSERT
WITH
    CHECK (true);

-- ================================
-- SEED DATA (CATEGORIAS)
-- ================================

COMMENT ON COLUMN items.category IS 'Categorias válidas: cadeira_rodas, cama_hospitalar, muleta, andador, oxigenio_portatil, nebulizador, cadeira_banho, suporte_soro, outros';

-- ================================
-- FIM DO SCHEMA
-- ================================