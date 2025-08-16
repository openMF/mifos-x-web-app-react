import Home from '@/pages/home/Home'
import Layout from '@/layout/Layout'
import Login from '@/pages/login/Login'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoutes from './ProtectedRoutes'
import ChartOfAccounts from '@/pages/accounting/chart-of-accounts/ChartOfAccounts'
import ViewGlAccounts from '@/pages/accounting/chart-of-accounts/ViewGlAccounts'
import CreateGlAccounts from '@/pages/accounting/chart-of-accounts/CreateGlAccounts'
import EditGlAccounts from '@/pages/accounting/chart-of-accounts/EditGlAccounts'
import CreateJournalEntry from '@/pages/accounting/create-journal-entry/CreateJournalEntry'
import FrequentPostings from '@/pages/accounting/frequent-postings/FrequentPostings'

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

          {/* Chart of Accounts Routes */}
          <Route path='accounting/chart-of-accounts' element={<ChartOfAccounts />} />
          <Route path='accounting/chart-of-accounts/gl-accounts/create' element={<CreateGlAccounts />} />
          <Route path='accounting/chart-of-accounts/gl-accounts/view/:id' element={<ViewGlAccounts />} />
          <Route path='accounting/chart-of-accounts/gl-accounts/view/:id/edit' element={<EditGlAccounts />} />

          {/* Journal Entries Routes */}
          <Route path='/accounting/journal-entries/create' element={<CreateJournalEntry />} />

          {/* Frequent Postings */}
          <Route path='/accounting/journal-entries/frequent-postings' element={<FrequentPostings />} />

        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
