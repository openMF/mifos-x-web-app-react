import Layout from '@/layout/Layout'
import Home from '@/pages/home/Home'
import Login from '@/pages/login/Login'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoutes from '@/router/ProtectedRoutes'


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoutes />}>
        <Route path='/' element={<Login/>}/>
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
