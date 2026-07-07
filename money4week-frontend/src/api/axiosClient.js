import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// THÊM TOKEN VÀO MỖI LẦN GỬI YÊU CẦU LÊN SERVER
axiosClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; 
  }
  return config;
});

// XỬ LÝ KẾT QUẢ TRẢ VỀ TỪ SERVER
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // ========================================================
    // CHỐT CHẶN BẢO MẬT: TỰ ĐỘNG XỬ LÝ LỖI 401 (HẾT HẠN TOKEN)
    // ========================================================
    if (error.response && error.response.status === 401) {
      console.error("Token hết hạn hoặc không hợp lệ. Hệ thống tự động đăng xuất...");
      
      // 1. Dọn dẹp sạch sẽ dữ liệu cũ trong máy
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userAvatar');
      
      // 2. Ép trình duyệt chuyển hướng về trang đăng nhập
      window.location.href = '/login'; 
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;