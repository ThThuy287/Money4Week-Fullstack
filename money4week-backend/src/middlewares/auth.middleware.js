const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Nếu không có token gửi kèm
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để tiếp tục');
    }

    // Lấy phần chìa khóa thật sự (bỏ chữ 'Bearer ' đi)
    const token = authHeader.split(' ')[1];
    
    // Dịch chìa khóa để lấy thông tin người dùng
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Gắn id của người dùng vào request để các hàm sau sử dụng
    req.user = decoded; // Dữ liệu sẽ có dạng { id: '...', jti: '...', iat, exp }
    
    next(); // Cho phép đi tiếp vào Controller
  } catch (error) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Token không hợp lệ hoặc đã hết hạn'));
  }
};

module.exports = authMiddleware;