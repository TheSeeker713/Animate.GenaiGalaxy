import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import RasterStudio from './pages/RasterStudio'
import RasterOnboarding from './pages/RasterOnboarding'
import VectorStudio from './pages/VectorStudio'
import CharacterStudio from './pages/CharacterStudio'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/raster" element={<RasterOnboarding />} />
        <Route path="/raster/:projectId" element={<RasterStudio />} />
        <Route path="/vector/:projectId" element={<VectorStudio />} />
        <Route path="/character/:characterId" element={<CharacterStudio />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

