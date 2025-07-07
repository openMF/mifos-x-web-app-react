import Home from '@/pages/home/Home'
import Layout from '@/layout/Layout'
import Login from '@/pages/login/Login'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoutes from './ProtectedRoutes'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoutes />}>
        {/* Login Route */}
        <Route path='/' element={<Login />} />
        <Route element={<Layout />}>
          {/* Home Route */}
          <Route path="/home" element={<Home />} />

        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
