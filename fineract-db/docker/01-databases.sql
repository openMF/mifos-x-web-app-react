-- Bootstrap databases for local development (PostgreSQL)
--
-- fineract_tenants is created by the postgres entrypoint via POSTGRES_DB.
-- This script adds the default tenant database alongside it.
CREATE DATABASE fineract_default;
