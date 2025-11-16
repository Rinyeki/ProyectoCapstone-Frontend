import React, { useState } from 'react'
import { register, authGoogleUrl } from '../utils/fetch.js'

export default function RegisterForm() {
  const [correo, setCorreo] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [nombre, setNombre] = useState('')
  const [rut, setRut] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      const res = await register({ correo, contraseña, nombre, rut_chileno: rut, rol: 'usuario' })
      localStorage.setItem('token', res.token)
      if (res.requiresRut) localStorage.setItem('requiresRut', 'true')
      window.location.href = '/'
    } catch (e2) {
      setError(e2.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const goGoogle = () => {
    const w = window.open(authGoogleUrl(), '_blank', 'width=500,height=700')
    if (w) w.focus()
  }

  return (
    <form className="card bg-base-100 shadow p-6 max-w-md mx-auto" onSubmit={submit}>
      <h1 className="text-2xl font-bold mb-4">Registro de usuario</h1>
      <label className="form-control w-full mb-3">
        <span className="label-text">Correo</span>
        <input type="email" className="input input-bordered w-full" value={correo} onChange={(e) => setCorreo(e.target.value)} />
      </label>
      <label className="form-control w-full mb-3">
        <span className="label-text">Contraseña</span>
        <input type="password" className="input input-bordered w-full" value={contraseña} onChange={(e) => setContraseña(e.target.value)} />
      </label>
      <label className="form-control w-full mb-3">
        <span className="label-text">Nombre</span>
        <input type="text" className="input input-bordered w-full" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </label>
      <label className="form-control w-full mb-4">
        <span className="label-text">RUT (opcional)</span>
        <input type="text" className="input input-bordered w-full" placeholder="12345678-K" value={rut} onChange={(e) => setRut(e.target.value)} />
      </label>
      {error ? <div className="text-error mb-3">{error}</div> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button className="btn btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrarse'}</button>
        <a className="btn btn-outline w-full" href="/" aria-label="Iniciar sesión">Login</a>
      </div>
      <div className="divider">o</div>
      <button type="button" className="btn btn-secondary w-full" onClick={goGoogle}>Continuar con Google</button>
    </form>
  )
}