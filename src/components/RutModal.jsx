import React, { useEffect, useState } from 'react'
import { setRut } from '../utils/fetch.js'

export default function RutModal() {
  const [open, setOpen] = useState(false)
  const [rut, setRutValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const requires = localStorage.getItem('requiresRut')
    if (requires === 'true') setOpen(true)
  }, [])

  const submitRut = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token') || ''
      await setRut(token, { rut_chileno: rut })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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