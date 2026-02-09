import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import RasterStudio from './pages/RasterStudio'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/raster/:projectId" element={<RasterStudio />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

