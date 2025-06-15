-- Multi-tenant migration script
-- This script migrates the database to support multi-tenant architecture

-- 1. First, ensure we have a default client for existing users
INSERT INTO o_auth_clients (
    id,
    client_id,
    client_secret_hash,
    name,
    description,
    redirect_uris,
    allowed_scopes,
    is_confidential,
    is_active,
    created_at,
    updated_at
) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'default-client',
    '0000000000000000000000000000000000000000000000000000000000000000', -- dummy hash
    'Default Client',
    'Default client for migrated users',
    ARRAY['http://localhost:3000/auth/callback'],
    ARRAY['openid', 'profile', 'email'],
    false,
    true,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 2. Add client_id column to users table (without constraints first)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS client_id uuid;

-- 3. Set default client_id for existing users
UPDATE users 
SET client_id = 'a0000000-0000-0000-0000-000000000001'::uuid 
WHERE client_id IS NULL;

-- 4. Now add the NOT NULL constraint
ALTER TABLE users 
ALTER COLUMN client_id SET NOT NULL;

-- 5. Make password_hash nullable for SNS users
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- 6. Add profile_image_url column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image_url text;

-- 7. Drop existing unique indexes on email and username
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_username;

-- 8. Create new composite unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_client_email 
ON users(client_id, email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_client_username 
ON users(client_id, username);

-- 9. Add foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT fk_users_client 
FOREIGN KEY (client_id) 
REFERENCES o_auth_clients(id) 
ON DELETE CASCADE;

-- 10. Create user_auth_providers table
CREATE TABLE IF NOT EXISTS user_auth_providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    provider_type text NOT NULL,
    provider_user_id text,
    provider_email text,
    provider_data jsonb,
    is_verified boolean DEFAULT false,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW(),
    
    CONSTRAINT fk_user_auth_providers_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE
);

-- 11. Create indexes for user_auth_providers
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_auth_providers_user_provider 
ON user_auth_providers(user_id, provider_type);

CREATE INDEX IF NOT EXISTS idx_user_auth_providers_provider_id 
ON user_auth_providers(provider_type, provider_user_id);

-- 12. Migrate existing users to have password provider
INSERT INTO user_auth_providers (user_id, provider_type, provider_email, is_verified, created_at, updated_at)
SELECT 
    u.id,
    'password' as provider_type,
    u.email as provider_email,
    u.email_verified as is_verified,
    u.created_at,
    u.updated_at
FROM users u
WHERE u.password_hash IS NOT NULL
ON CONFLICT DO NOTHING;

-- 13. Add index for client_id in users table
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);

-- Migration complete!
-- Note: After this migration, all authentication logic must include client_id