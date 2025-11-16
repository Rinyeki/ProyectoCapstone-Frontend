import React, { useEffect, useState } from 'react'

export default function Navbar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const load = () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return setUser(null)
        const part = token.split('.')[1]
        if (!part) return setUser(null)
        const payload = JSON.parse(decodeURIComponent(escape(atob(part.replace(/-/g, '+').replace(/_/g, '/')))))
        setUser(payload || null)
      } catch {
        setUser(null)
      }
    }
    load()
    const onStorage = (e) => {
      if (e.key === 'token') load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('requiresRut')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <div className="navbar bg-base-100 border-b">
      <div className="flex-1">
        <a href="/" className="btn btn-ghost text-xl">Capstone</a>
      </div>
      <div className="flex-none gap-2">
        {user ? (
          <>
            <span className="btn btn-ghost">Hola, {user.nombre || user.correo || 'Usuario'}</span>
            {user.rut_chileno ? <a href="/pymes/new" className="btn">Registrar Pyme</a> : null}
            <button className="btn btn-outline" onClick={logout}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <a href="/login" className="btn">Login</a>
            <a href="/register" className="btn btn-primary">Registrarse</a>
          </>
        )}
      </div>
    </div>
  )
}