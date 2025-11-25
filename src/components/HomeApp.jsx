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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pageSize = 9

  useEffect(() => {
    setLoading(true)
    setError('')
    listPymes(undefined, { limit: pageSize, offset: page * pageSize })
      .then((data)=>{
        setResults(Array.isArray(data) ? data : [])
      })
      .catch((e)=>{
        setError(e && e.message ? e.message : 'Error al cargar pymes')
        setResults([])
      })
      .finally(()=> setLoading(false))
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
      <div className="flex justify-center gap-2">
        <button className="btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Anterior</button>
        <button className="btn" disabled={results.length < pageSize} onClick={() => setPage(p => p + 1)}>Siguiente</button>
      </div>
    </div>
  )
}
