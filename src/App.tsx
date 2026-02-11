import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import RasterStudio from './pages/RasterStudio'
import RasterOnboarding from './pages/RasterOnboarding'
import VectorStudio from './pages/VectorStudio'
import CharacterStudio from './pages/CharacterStudio'
import StoryBuilder from './pages/StoryBuilder'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/raster" element={<RasterOnboarding />} />
        <Route path="/raster/:projectId" element={<RasterStudio />} />
        <Route path="/vector/:projectId" element={<VectorStudio />} />
        <Route path="/character/:characterId" element={<CharacterStudio />} />
        <Route path="/story/:id" element={<StoryBuilder />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

