import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Families } from './pages/Families'
import { FamilyDetail } from './pages/FamilyDetail'
import { Payments } from './pages/Payments'
import { Children } from './pages/Children'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/families" element={<Families />} />
        <Route path="/families/:id" element={<FamilyDetail />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/children" element={<Children />} />
      </Routes>
    </Layout>
  )
}

export default App