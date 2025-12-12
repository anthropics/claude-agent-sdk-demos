-- SMS Response Assistant Database Schema

-- Store contacts and their relationship context
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT,
    relationship TEXT, -- 'family', 'friend', 'work', 'unknown'
    trust_level INTEGER DEFAULT 0, -- 0-3: unknown, acquaintance, trusted, verified
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Store SMS conversations
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    phone_number TEXT NOT NULL,
    message_text TEXT NOT NULL,
    direction TEXT NOT NULL, -- 'incoming' or 'outgoing'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_auto_reply BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_messages_contact_timestamp
ON messages(contact_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_messages_phone_timestamp
ON messages(phone_number, timestamp);

CREATE INDEX IF NOT EXISTS idx_contacts_phone
ON contacts(phone_number);