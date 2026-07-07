// src/api/categoryApi.js
import axiosClient from './axiosClient';

const categoryApi = {
  // Đảm bảo khớp với đường dẫn đã mount trong app.js
  getCategories: async () => await axiosClient.get('/categories'), 
  createCategory: async (data) => await axiosClient.post('/categories', data),
  updateCategory: async (id, data) => await axiosClient.put(`/categories/${id}`, data),
  deleteCategory: async (id) => await axiosClient.delete(`/categories/${id}`)
};

export default categoryApi;