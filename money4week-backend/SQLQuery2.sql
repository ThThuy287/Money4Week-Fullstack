-- 1. Tạo một Login hệ thống (Mật khẩu mình đặt tạm là: Password123@)
CREATE LOGIN money4week_user WITH PASSWORD = 'Money4week@2026';
GO

-- 2. Cấp quyền truy cập tối cao vào Database dự án
USE money4week;
GO
CREATE USER money4week_user FOR LOGIN money4week_user;
ALTER ROLE db_owner ADD MEMBER money4week_user;
GO