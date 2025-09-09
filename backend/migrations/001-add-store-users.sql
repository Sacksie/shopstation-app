-- Migration to add store_users and enhance security for the Store Portal

-- Step 1: Create the store_users table
-- This table will store login credentials for store owners and managers.
CREATE TABLE IF NOT EXISTS store_users (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add an index on the email column for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_store_users_email ON store_users(email);

-- Step 2: Add a foreign key from store_products to stores
-- This improves data integrity by ensuring that every product price is linked to a valid store.
-- The ON DELETE CASCADE means that if a store is deleted, all its product prices will be too.
ALTER TABLE store_products
ADD CONSTRAINT fk_store
FOREIGN KEY (store_id) 
REFERENCES stores(id) 
ON DELETE CASCADE;

-- Step 3: Add created_at and updated_at timestamps to existing tables
-- This is good practice for auditing and tracking changes.
ALTER TABLE stores ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- Step 4: Create a trigger function to automatically update the updated_at timestamp
-- This function will be triggered whenever a row is updated in any of the tables.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to our tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_stores') THEN
    CREATE TRIGGER set_timestamp_stores
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_products') THEN
    CREATE TRIGGER set_timestamp_products
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_categories') THEN
    CREATE TRIGGER set_timestamp_categories
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_store_users') THEN
     CREATE TRIGGER set_timestamp_store_users
    BEFORE UPDATE ON store_users
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
END
$$;

-- End of migration
