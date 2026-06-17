import { login as apiLogin, register as apiRegister } from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const registerUser = async (role, id, password) => {
  await apiRegister(role, id, password);
};

export const loginUser = async (role, id, password) => {
  const response = await apiLogin(role, id, password);
  const { token, role: userRole, id: userId } = response.data;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify({ role: userRole, id: userId }));
  return { role: userRole, id: userId };
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = () => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem(TOKEN_KEY);
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);