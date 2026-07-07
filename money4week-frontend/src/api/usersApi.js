import axiosClient from './axiosClient';

const usersApi = {
  // Lấy dữ liệu hồ sơ từ Database
  getProfile: async () => await axiosClient.get('/users/profile'),
  
  // Lưu dữ liệu hồ sơ xuống Database
  updateProfile: async (data) => await axiosClient.put('/users/profile', data)
};

export default usersApi;