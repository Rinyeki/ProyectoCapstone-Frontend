import React, { useEffect, useState } from 'react'
import SearchBar from './SearchBar.jsx'
import MapLeaflet from './MapLeaflet.jsx'
import { listPymes } from '../utils/fetch.js'
import PymeCard from './PymeCard.jsx'

export default function HomeApp() {
  const [results, setResults] = useState([])
  const [center, setCenter] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [totalPages, setTotalPages] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pageSize = 9

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const curr = await listPymes(undefined, { limit: pageSize, offset: page * pageSize })
        const arr = Array.isArray(curr) ? curr : []
        if (cancelled) return
        setResults(arr)
        try {
          const nxt = await listPymes(undefined, { limit: pageSize, offset: (page+1) * pageSize })
          const nxtArr = Array.isArray(nxt) ? nxt : []
          const nextExists = nxtArr.length > 0
          setHasNext(nextExists)
          if (!nextExists) setTotalPages(page + 1)
          else setTotalPages(null)
        } catch {
          setHasNext(false)
          setTotalPages(page + 1)
        }
      } catch (e) {
        if (cancelled) return
        setError(e && e.message ? e.message : 'Error al cargar pymes')
        setResults([])
        setHasNext(false)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page])

  return (
    <div className="space-y-4">
      <SearchBar onResults={setResults} onCenter={setCenter} onFilters={setFilters} />
      {selected ? (
        <div>
          <div className="sticky top-2 z-10 flex justify-end pr-2">
            <button className="btn btn-xs btn-circle" onClick={()=>setSelected(null)}>✕</button>
          </div>
          <div className="card bg-base-100 shadow p-4">
            <PymeCard pyme={selected} />
          </div>
        </div>
      ) : null}
      <MapLeaflet points={results} center={center} comunaFilter={filters.comuna} onSelect={setSelected} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((p)=> (<PymeCard key={p.id || p.nombre} pyme={p} />))}
      </div>
      {(!loading && !results.length) ? (
        <div className="text-center opacity-70">No hay pymes para mostrar</div>
      ) : null}
      {error ? (
        <div className="text-center text-error">{error}</div>
      ) : null}
      <div className="flex items-center gap-3 justify-center">
        <div className="flex gap-2">
          <button className="btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Anterior</button>
          <button className="btn" disabled={!hasNext} onClick={() => setPage(p => p + 1)}>Siguiente</button>
        </div>
        <div className="text-sm opacity-70">Página {page+1}{totalPages ? ` / ${totalPages}` : ''}</div>
      </div>
    </div>
  )
}
