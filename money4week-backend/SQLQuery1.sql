-- Lệnh này ép hệ thống mở khóa (UNLOCK) nếu tài khoản đang bị kẹt do sai pass nhiều lần
ALTER LOGIN money4week_user WITH PASSWORD = 'Money4week@2026' UNLOCK;
ALTER LOGIN money4week_user ENABLE;
GO