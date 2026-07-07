import axiosClient from './axiosClient';

const reportsApi = {
  getReportData: async (startDate, endDate) => {
    return await axiosClient.get('/transactions', { params: { startDate, endDate, limit: 1000, _t: Date.now() } });
  },
  
  getCategories: async () => await axiosClient.get('/categories', { params: { _t: Date.now() } }),
  
  // SỬA Ở ĐÂY: Lấy Lịch sử giao dịch ví (để lọc được theo Tuần/Chu kỳ)
  getTotalSavings: async () => {
    return await axiosClient.get('/wallets/history', { params: { _t: Date.now() } });
  }
};

export default reportsApi;