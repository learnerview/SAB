CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE api_keys
SET api_key = encode(digest(api_key, 'sha256'), 'hex');
