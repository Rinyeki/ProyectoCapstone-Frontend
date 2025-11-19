import React, { useEffect, useState } from 'react'
import { setRut } from '../utils/fetch.js'

export default function RutModal() {
  const [open, setOpen] = useState(false)
  const [rut, setRutValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const check = () => {
      let requires = localStorage.getItem('requiresRut') === 'true'
      try {
        const token = localStorage.getItem('token') || ''
        const part = token.split('.')[1]
        if (part) {
          const payload = JSON.parse(decodeURIComponent(escape(atob(part.replace(/-/g,'+').replace(/_/g,'/')))))
          if (payload && payload.rut_chileno) {
            requires = false
            localStorage.removeItem('requiresRut')
          }
        }
      } catch {}
      const fromQuery = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('rut') === '1'
      setOpen(requires && fromQuery)
    }
    check()
    const onStorage = (e) => {
      if (!e || !e.key) return
      if (e.key === 'requiresRut' || e.key === 'token') check()
    }
    const onMessage = (e) => {
      try {
        const data = e.data || {}
        if (data && data.type === 'auth') {
          if (data.requiresRut != null) localStorage.setItem('requiresRut', String(data.requiresRut))
          if (data.token) localStorage.setItem('token', data.token)
          check()
        }
      } catch {}
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('message', onMessage)
    }
  }, [])

  const submitRut = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token') || ''
      const res = await setRut(token, { rut_chileno: rut })
      if (res && res.token) localStorage.setItem('token', res.token)
      localStorage.removeItem('requiresRut')
      setOpen(false)
    } catch (e) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-box p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Ingresa tu RUT</h2>
        <input
          type="text"
          className="input input-bordered w-full mb-3"
          placeholder="12345678-K"
          value={rut}
          onChange={(e) => setRutValue(e.target.value)}
        />
        {error ? <div className="text-error mb-3">{error}</div> : null}
        <button className="btn btn-primary w-full" onClick={submitRut} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div>
  )
}