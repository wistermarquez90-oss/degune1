import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Boletines from './pages/Boletines'
import Admin from './pages/Admin'
import ImportPage from './pages/ImportPage'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/boletines" element={<Boletines />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/import" element={<ImportPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
