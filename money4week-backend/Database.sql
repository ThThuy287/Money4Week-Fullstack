CREATE DATABASE money4week;
USE money4week;
GO
-- =============================================
-- 1. AUTH & USER MANAGEMENT
-- =============================================
CREATE TABLE users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255) UNIQUE NOT NULL,
  password_hash NVARCHAR(255),
  google_id NVARCHAR(255) UNIQUE,
  full_name NVARCHAR(255) NOT NULL,
  job_title NVARCHAR(255),
  avatar_url NVARCHAR(MAX),
  is_active BIT NOT NULL DEFAULT 1,
  is_email_verified BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX idx_users_email ON users(email);
GO

CREATE TABLE refresh_tokens (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
  token_hash NVARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME2 NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  revoked_at DATETIME2
);
GO

CREATE INDEX idx_rt_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_rt_user_revoked ON refresh_tokens(user_id, revoked_at);
GO

-- =============================================
-- 2. USER CONFIGURATION
-- =============================================
CREATE TABLE user_settings (
  user_id UNIQUEIDENTIFIER PRIMARY KEY FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
  cycle_type NVARCHAR(50) NOT NULL DEFAULT '4_weeks',
  cycle_anchor_date DATE NOT NULL,
  theme NVARCHAR(50) NOT NULL DEFAULT 'light',
  language NVARCHAR(50) NOT NULL DEFAULT 'vi',
  updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 3. CATEGORIES & TRANSACTIONS
-- =============================================
CREATE TABLE categories (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  type NVARCHAR(50) NOT NULL,
  icon NVARCHAR(255),
  color_hex NVARCHAR(50),
  is_active BIT NOT NULL DEFAULT 1
);
GO

CREATE INDEX idx_categories_user_type ON categories(user_id, type);
GO

CREATE TABLE transactions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
  category_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES categories(id) ON DELETE NO ACTION,
  type NVARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  note NVARCHAR(MAX),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  deleted_at DATETIME2
);
GO

CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
GO

-- =============================================
-- 4. SAVINGS WALLETS
-- =============================================
CREATE TABLE wallets (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  deadline_date DATE NOT NULL,
  color_hex NVARCHAR(50),
  is_completed BIT NOT NULL DEFAULT 0,
  is_archived BIT NOT NULL DEFAULT 0,
  is_auto_deduct BIT NOT NULL DEFAULT 0,
  auto_frequency NVARCHAR(50),
  auto_amount DECIMAL(15, 2),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX idx_wallets_user_archived ON wallets(user_id, is_archived);
GO

CREATE TABLE wallet_transactions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  wallet_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES wallets(id) ON DELETE CASCADE,
  type NVARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  source NVARCHAR(50) NOT NULL DEFAULT 'manual',
  transaction_date DATE NOT NULL,
  note NVARCHAR(MAX),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX idx_wallet_trans_wallet_date ON wallet_transactions(wallet_id, transaction_date DESC);
GO

-- =============================================
-- 5. REMINDERS & NOTES
-- =============================================
CREATE TABLE reminders (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
  category_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES categories(id) ON DELETE NO ACTION,
  title NVARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  due_date DATE NOT NULL,
  note NVARCHAR(MAX),
  is_paid BIT NOT NULL DEFAULT 0,
  is_recurring BIT NOT NULL DEFAULT 0,
  recurrence_type NVARCHAR(50),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX idx_reminders_user_due_paid ON reminders(user_id, due_date, is_paid);
GO

CREATE TABLE notes (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
  content NVARCHAR(MAX) NOT NULL,
  is_completed BIT NOT NULL DEFAULT 0,
  position INT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX idx_notes_user_position ON notes(user_id, position);
GO
ALTER TABLE dbo.users 
ADD reset_token NVARCHAR(255) NULL,
    reset_token_expiry DATETIME2 NULL;

UPDATE users SET is_active = 1, is_email_verified = 1 WHERE is_active IS NULL;
USE money4week;

-- 1. Thêm cột category_id (Cho phép NULL nếu ví không cần danh mục)
ALTER TABLE wallets ADD category_id UNIQUEIDENTIFIER NULL;

-- 2. Thêm cột color để lưu mã màu bạn vừa chọn trên UI
ALTER TABLE wallets ADD color NVARCHAR(50) DEFAULT '#094CB2';
USE money4week;
ALTER TABLE categories ADD note NVARCHAR(255) NULL;
USE money4week;
ALTER TABLE categories ADD limit_amount DECIMAL(15,2) DEFAULT 0;
USE money4week;
-- Bỏ qua nếu máy báo cột đã tồn tại
ALTER TABLE wallets ADD icon NVARCHAR(50) DEFAULT 'Wallet';
ALTER TABLE users ALTER COLUMN avatar_url NVARCHAR(MAX);
-- 1. Xóa toàn bộ giao dịch test
DELETE FROM transactions;

-- 2. Xóa toàn bộ ghi chú và nhắc nhở
DELETE FROM notes;
DELETE FROM reminders;

-- 3. Xóa lịch sử nạp/rút ví tiết kiệm
DELETE FROM wallets;

-- 4. Xóa danh mục (Tùy chọn: Nếu bạn muốn user tự tạo mới hoàn toàn)
DELETE FROM categories;

-- 5. Xóa toàn bộ tài khoản user test (Xóa cuối cùng)
DELETE FROM users;

-- LƯU Ý: Thay vì DELETE, nếu bạn muốn reset lại cả số ID (Identity) về 1, hãy dùng lệnh TRUNCATE TABLE (nhưng lệnh này đòi hỏi phải gỡ khóa ngoại tạm thời).