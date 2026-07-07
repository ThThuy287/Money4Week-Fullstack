import axiosClient from './axiosClient';

const remindersApi = {
  // Lấy danh sách các mục tiêu/kế hoạch
  getReminders: async (params) => await axiosClient.get('/reminders', { params }),
  
  // Tạo mục tiêu mới
  createReminder: async (data) => await axiosClient.post('/reminders', data),
  
  // Xóa mục tiêu (nếu Backend có hỗ trợ)
  deleteReminder: async (id) => await axiosClient.delete(`/reminders/${id}`),
  deposit: async (id, data) => await axiosClient.post(`/reminders/${id}/deposit`, data)
};

export default remindersApi;