import axiosClient from './axiosClient';

const walletsApi = {
  getWallets: async () => await axiosClient.get('/wallets'),
  createWallet: async (data) => await axiosClient.post('/wallets', data),
  updateWallet: async (id, data) => await axiosClient.put(`/wallets/${id}`, data),
  deleteWallet: async (id) => await axiosClient.delete(`/wallets/${id}`),
  deposit: async (id, data) => await axiosClient.post(`/wallets/${id}/deposit`, data),
  withdraw: async (id, data) => await axiosClient.post(`/wallets/${id}/withdraw`, data), // Bổ sung dòng này
  getHistory: async () => await axiosClient.get('/wallets/history')
};

export default walletsApi;