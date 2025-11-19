import React, { useEffect, useState } from 'react'
import SearchBar from './SearchBar.jsx'
import MapLeaflet from './MapLeaflet.jsx'
import { listPymes } from '../utils/fetch.js'
import PymeCard from './PymeCard.jsx'

export default function HomeApp() {
  const [results, setResults] = useState([])
  const [center, setCenter] = useState(null)
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(0)
  const pageSize = 9

  useEffect(() => {
    listPymes(undefined, { limit: pageSize, offset: page * pageSize }).then((data)=>{
      setResults(Array.isArray(data) ? data : [])
    }).catch(()=>{})
  }, [page])

  return (
    <div className="space-y-4">
      <SearchBar onResults={setResults} onCenter={setCenter} />
      {selected ? (
        <div className="card bg-base-100 shadow p-4">
          <PymeCard pyme={selected} />
        </div>
      ) : null}
      <MapLeaflet points={results} center={center} onSelect={setSelected} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((p)=> (<PymeCard key={p.id || p.nombre} pyme={p} />))}
      </div>
      <div className="flex justify-center gap-2">
        <button className="btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Anterior</button>
        <button className="btn" disabled={results.length < pageSize} onClick={() => setPage(p => p + 1)}>Siguiente</button>
      </div>
    </div>
  )
}