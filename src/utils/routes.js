export const API_URL = 'http://localhost:3000'
// Rutas Auth y login 
export const AUTH_LOGIN = `${API_URL}/auth/login`
export const AUTH_GOOGLE = `${API_URL}/auth/google`
export const AUTH_GOOGLE_CALLBACK = `${API_URL}/auth/google/callback`
export const AUTH_REGISTER = `${API_URL}/auth/register`
export const AUTH_CHANGE_PASSWORD = `${API_URL}/auth/change-password`
export const AUTH_REQUEST_EMAIL_CHANGE = `${API_URL}/auth/request-email-change`
export const AUTH_CONFIRM_EMAIL_CHANGE = `${API_URL}/auth/confirm-email-change`
export const AUTH_UPDATE_NAME = `${API_URL}/auth/update-name`
export const AUTH_SET_RUT = `${API_URL}/auth/set-rut`

// Rutas Usuarios
export const USERS_GET = `${API_URL}/users`
export const USUARIOS_ID = (id) => `${API_URL}/usuarios/${id}`;
export const USUARIOS_ID_FILTROS = (id) => `${API_URL}/usuarios/${id}/con-filtros`;
export const USUARIOS_ID_PYMES = (id) => `${API_URL}/usuarios/${id}/pymes`;
export const USERS_POST = `${API_URL}/usuarios`
export const USERS_PUT = (id) => `${API_URL}/usuarios/${id}`;
export const USERS_DEL = (id) => `${API_URL}/usuarios/${id}`;

// Rutas Pymes
export const PYME_GET = `${API_URL}/pymes`
export const PYME_ID = (id) => `${API_URL}/pymes/${id}`;
export const PYME_POST = `${API_URL}/pymes`
export const PYME_PUT = (id) => `${API_URL}/pymes/${id}`;
export const PYME_DEL = (id) => `${API_URL}/pymes/${id}`;



