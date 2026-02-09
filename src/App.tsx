import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import RasterStudio from './pages/RasterStudio'
import VectorStudio from './pages/VectorStudio'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/raster/:projectId" element={<RasterStudio />} />
        <Route path="/vector/:projectId" element={<VectorStudio />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

