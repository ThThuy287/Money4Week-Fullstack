import axiosClient from './axiosClient';

const authApi = {
  login: (data) => axiosClient.post('/auth/login', data),
  register: (data) => axiosClient.post('/auth/register', data),
  forgotPassword: (data) => axiosClient.post('/auth/forgot-password', data),
  resetPassword: (data) => axiosClient.post('/auth/reset-password', data),
  
  // BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ FRONTEND GỌI ĐƯỢC BACKEND:
  resetPasswordDirect: (data) => axiosClient.post('/auth/reset-password-direct', data),
};

export default authApi;