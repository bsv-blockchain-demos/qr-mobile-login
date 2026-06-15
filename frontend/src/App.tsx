import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DesktopView } from './views/DesktopView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DesktopView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
