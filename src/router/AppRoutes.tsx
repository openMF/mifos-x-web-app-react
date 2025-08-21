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
import Notifications from '@/pages/notifications/Notifications'
import Dashboard from '@/pages/home/dashboard/Dashboard'
import IndividualCollectionSheet from '@/pages/collections/IndividualCollectionSheet'
import Navigation from '@/pages/navigation/Navigation'
import CheckerInBoxAndTasks from '@/pages/tasks/checker-inbox-and-tasks/CheckerInBoxAndTasks'
import CheckerInboxContent from '@/pages/tasks/checker-inbox-and-tasks-tabs/checker-inbox/CheckerInbox'
import ClientApproval from '@/pages/tasks/checker-inbox-and-tasks-tabs/client-approval/ClientApproval'
import LoanApproval from '@/pages/tasks/checker-inbox-and-tasks-tabs/loan-approval/LoanApproval'
import LoanDisbursal from '@/pages/tasks/checker-inbox-and-tasks-tabs/loan-disbursal/LoanDisbursal'
import RescheduleLoan from '@/pages/tasks/checker-inbox-and-tasks-tabs/reschedule-loan/RescheduleLoan'
import Profile from '@/pages/profile/Profile'
import NotFound from '@/pages/not-found/NotFound'
import Settings from '@/pages/settings/Settings'

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

          {/* Notifications Routes */}
          <Route path='/notifications' element={<Notifications />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Profile and Settings */}
          <Route path='/profile' element={<Profile />} />
          <Route path='/settings' element={<Settings />} />

          {/* Individual Collection Sheet Route */}
          <Route path='/individual-collection-sheet' element={<IndividualCollectionSheet />} />

          {/* Navigation Routes */}
          <Route path='/navigation' element={<Navigation />} />

          {/* Checker Inbox and Tasks */}
          <Route path="/checker-inbox-and-tasks" element={<CheckerInBoxAndTasks />}>
            <Route path="checker-inbox" element={<CheckerInboxContent />} />
            <Route path='client-approval' element={<ClientApproval />} />
            <Route path='loan-approval' element={<LoanApproval />} />
            <Route path='loan-disbursal' element={<LoanDisbursal />} />
            <Route path='reschedule-loan' element={<RescheduleLoan />} />
          </Route>


        </Route>
      </Route>

      <Route path="*" element={<NotFound/>}/>
    </Routes>
  )
}

export default AppRoutes
