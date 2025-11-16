import React, { useState } from 'react'
import SearchBar from './SearchBar.jsx'
import MapLeaflet from './MapLeaflet.jsx'

export default function HomeApp() {
  const [results, setResults] = useState([])
  return (
    <div className="space-y-4">
      <SearchBar onResults={setResults} />
      <MapLeaflet points={results} />
    </div>
  )
}