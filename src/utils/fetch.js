import {
  API_URL,
  AUTH_LOGIN,
  AUTH_GOOGLE,
  AUTH_GOOGLE_CALLBACK,
  AUTH_REGISTER,
  AUTH_CHANGE_PASSWORD,
  AUTH_REQUEST_EMAIL_CHANGE,
  AUTH_CONFIRM_EMAIL_CHANGE,
  AUTH_UPDATE_NAME,
  AUTH_SET_RUT,
  USERS_GET,
  USUARIOS_ID,
  USUARIOS_ID_FILTROS,
  USUARIOS_ID_PYMES,
  USERS_POST,
  USERS_PUT,
  USERS_DEL,
  PYME_GET,
  PYME_ID,
  PYME_POST,
  PYME_PUT,
  PYME_DEL,
} from './routes.js'

function buildQuery(params) {
  if (!params) return ''
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (Array.isArray(v)) v.forEach((item) => search.append(k, String(item)))
    else search.append(k, String(v))
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

async function request(url, { method = 'GET', token, body, query } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const hasBody = body !== undefined && body !== null
  if (hasBody) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${url}${buildQuery(query)}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  })
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  if (!res.ok) {
    const errData = isJson ? await res.json().catch(() => null) : null
    const message = errData && errData.message ? errData.message : `HTTP ${res.status}`
    const e = new Error(message)
    e.status = res.status
    e.data = errData
    throw e
  }
  return isJson ? res.json() : res.text()
}

export function authGoogleUrl() {
  return `${AUTH_GOOGLE}?front=1`
}

export function authGoogleCallbackUrl() {
  return AUTH_GOOGLE_CALLBACK
}

export function healthUrl() {
  return `${API_URL}/health`
}

export async function login(correo, contraseña) {
  return request(AUTH_LOGIN, { method: 'POST', body: { correo, contraseña } })
}

export async function register({ correo, contraseña, nombre, rut_chileno, rol }) {
  return request(AUTH_REGISTER, {
    method: 'POST',
    body: { correo, contraseña, nombre, rut_chileno, rol },
  })
}

export async function changePassword(token, { oldPassword, newPassword }) {
  return request(AUTH_CHANGE_PASSWORD, {
    method: 'POST',
    token,
    body: { oldPassword, newPassword },
  })
}

export async function requestEmailChange(token, { nuevo_correo }) {
  return request(AUTH_REQUEST_EMAIL_CHANGE, {
    method: 'POST',
    token,
    body: { nuevo_correo },
  })
}

export async function confirmEmailChange(token, { emailToken }) {
  return request(AUTH_CONFIRM_EMAIL_CHANGE, {
    method: 'POST',
    token,
    body: { token: emailToken },
  })
}

export async function updateName(token, { nombre }) {
  return request(AUTH_UPDATE_NAME, { method: 'PATCH', token, body: { nombre } })
}

export async function setRut(token, { rut_chileno }) {
  return request(AUTH_SET_RUT, { method: 'POST', token, body: { rut_chileno } })
}

export async function listUsuarios(token, params) {
  return request(USERS_GET, { method: 'GET', token, query: params })
}

export async function getUsuario(token, id) {
  return request(USUARIOS_ID(id), { method: 'GET', token })
}

export async function getUsuarioConFiltros(token, id, params) {
  return request(USUARIOS_ID_FILTROS(id), { method: 'GET', token, query: params })
}

export async function getUsuarioPymes(token, id, params) {
  return request(USUARIOS_ID_PYMES(id), { method: 'GET', token, query: params })
}

export async function createUsuario(token, data) {
  return request(USERS_POST, { method: 'POST', token, body: data })
}

export async function updateUsuario(token, id, data) {
  return request(USERS_PUT(id), { method: 'PUT', token, body: data })
}

export async function deleteUsuario(token, id) {
  return request(USERS_DEL(id), { method: 'DELETE', token })
}

export async function listPymes(token, params) {
  return request(PYME_GET, { method: 'GET', token, query: params })
}

export async function getPyme(token, id) {
  return request(PYME_ID(id), { method: 'GET', token })
}

export async function createPyme(token, data) {
  return request(PYME_POST, { method: 'POST', token, body: data })
}

export async function updatePyme(token, id, data) {
  return request(PYME_PUT(id), { method: 'PUT', token, body: data })
}

export async function deletePyme(token, id) {
  return request(PYME_DEL(id), { method: 'DELETE', token })
}
