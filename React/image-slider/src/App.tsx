import AutoImageSlider from './AutoImageSlider'
import TestTable from './TestTable'
import { Navigate, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AutoImageSlider />} />
      <Route path="/table" element={<TestTable />} />
    </Routes>
  )
}

export default App;