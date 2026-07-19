import axiosClient from './axiosClient';

const transactionsApi = {
  getTransactions: async (params) => await axiosClient.get('/transactions', { params: { ...params, _t: Date.now() } }),
  createTransaction: async (data) => await axiosClient.post('/transactions', data),
  deleteTransaction: async (id) => await axiosClient.delete(`/transactions/${id}`),
  resetTransactions: async () => await axiosClient.delete('/transactions/reset'),
  updateTransaction: async (id, data) => await axiosClient.put(`/transactions/${id}`, data),

  // Thêm _t: Date.now() để phá cache trình duyệt
  getCategories: async (type) => await axiosClient.get('/categories', { params: { type, _t: Date.now() } }),
  createCategory: async (data) => await axiosClient.post('/categories', data),
  updateCategory: async (id, data) => await axiosClient.put(`/categories/${id}`, data),
  deleteCategory: async (id) => await axiosClient.delete(`/categories/${id}`)
};

export default transactionsApi;