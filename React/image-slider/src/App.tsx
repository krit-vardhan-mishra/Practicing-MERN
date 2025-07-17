import AutoImageSlider from './AutoImageSlider'
import { Navigate, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AutoImageSlider />} />
    </Routes>
  )
}

export default App;