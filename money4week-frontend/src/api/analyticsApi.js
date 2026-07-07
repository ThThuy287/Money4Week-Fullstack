import axiosClient from './axiosClient';

const analyticsApi = {
  getDashboard: async () => await axiosClient.get('/analytics/dashboard'),
  getReports: async (params) => await axiosClient.get('/analytics/reports', { params }),
  
  // 3 lệnh API mới cho Ghi chú
  addNote: async (text) => await axiosClient.post('/analytics/notes', { text }),
  toggleNote: async (id) => await axiosClient.put(`/analytics/notes/${id}`),
  deleteNote: async (id) => await axiosClient.delete(`/analytics/notes/${id}`)
};

export default analyticsApi;