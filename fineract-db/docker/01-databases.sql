# create databases
CREATE DATABASE IF NOT EXISTS `fineract_tenants`;
CREATE DATABASE IF NOT EXISTS `fineract_default`;

# create a dedicated fineract user with minimal privileges
# NOTE: Empty password for local dev only - NEVER use in production!
CREATE USER IF NOT EXISTS 'fineract'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON `fineract_tenants`.* TO 'fineract'@'%';
GRANT ALL PRIVILEGES ON `fineract_default`.* TO 'fineract'@'%';
FLUSH PRIVILEGES;

# NOTE: For backward compatibility, root still has access via MYSQL_ROOT_PASSWORD.
# In production, switch Fineract's HIKARI_USERNAME to 'fineract' and use a strong password.
