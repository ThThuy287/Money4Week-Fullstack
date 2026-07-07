const authService = require('../services/auth.service');
const ApiError = require('../utils/apiError');

class AuthController {
  async register(req, res, next) {
    try {
      const { full_name, email, password } = req.body;
      
      if (!full_name || !email || !password) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Vui lòng điền đủ họ tên, email và mật khẩu');
      }
      if (password.length < 8) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Mật khẩu phải dài tối thiểu 8 ký tự', 'password');
      }

      const tokens = await authService.register(full_name, email, password);
      res.status(201).json({ message: 'Đăng ký thành công', ...tokens });
    } catch (error) {
      next(error); 
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Vui lòng cung cấp email và mật khẩu');
      }

      const tokens = await authService.login(email, password);
      res.status(200).json({ message: 'Đăng nhập thành công', ...tokens });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      res.status(200).json({ message: 'Làm mới Token thành công', ...tokens });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Vui lòng cung cấp email');
      }

      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Thiếu token hoặc mật khẩu mới');
      }

      await authService.resetPassword(token, newPassword);
      res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // HÀM MỚI: ĐỔI MẬT KHẨU TRỰC TIẾP (KHÔNG CẦN EMAIL)
  // ==========================================
  async resetPasswordDirect(req, res, next) {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Vui lòng cung cấp email và mật khẩu mới');
      }
      if (newPassword.length < 8) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Mật khẩu phải dài tối thiểu 8 ký tự');
      }

      // Gọi logic từ Service để thực hiện cập nhật CSDL
      await authService.resetPasswordDirect(email, newPassword);
      
      res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();