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
import Accounting from '@/pages/accounting/Accounting'
import SearchJournalEntry from '@/pages/accounting/create-journal-entry/SearchJournalEntry'
import AccountingRules from '@/pages/accounting/accounting-rules/AccountingRules'
import ViewAccountingRules from '@/pages/accounting/accounting-rules/ViewAccountingRules'
import Closure from '@/pages/accounting/closing-entries/Closure'
import CreateClosure from '@/pages/accounting/closing-entries/CreateClosure'
import ViewClosure from '@/pages/accounting/closing-entries/ViewClosure'
import EditClosure from '@/pages/accounting/closing-entries/EditClosure'
import FinancialActivityMappings from '@/pages/accounting/financial-activity-mappings/FinancialActivityMappings'
import CreateFinancialActivityMappings from '@/pages/accounting/financial-activity-mappings/CreateFinancialActivityMappings'
import ViewFinancialActivityMappings from '@/pages/accounting/financial-activity-mappings/ViewFinancialActivityMappings'
import PeriodicAccruals from '@/pages/accounting/periodic-accruals/PeriodicAccruals'
import ProvisioningEntries from '@/pages/accounting/provisioning-entries/ProvisioningEntries'
import Reports from '@/pages/reports/Reports'
import Users from '@/pages/users/Users'
import ViewUsers from '@/pages/users/ViewUsers'
import CreateUsers from '@/pages/users/CreateUsers'
import EditUsers from '@/pages/users/EditUsers'

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

          {/* Accounting */}
          <Route path='/accounting' element={<Accounting />} />

          {/* Chart of Accounts Routes */}
          <Route path='accounting/chart-of-accounts' element={<ChartOfAccounts />} />
          <Route path='accounting/chart-of-accounts/gl-accounts/create' element={<CreateGlAccounts />} />
          <Route path='accounting/chart-of-accounts/gl-accounts/view/:id' element={<ViewGlAccounts />} />
          <Route path='accounting/chart-of-accounts/gl-accounts/view/:id/edit' element={<EditGlAccounts />} />

          {/* Journal Entries Routes */}
          <Route path='/accounting/journal-entries' element={<SearchJournalEntry />} />
          <Route path='/accounting/journal-entries/create' element={<CreateJournalEntry />} />

          {/* Frequent Postings */}
          <Route path='/accounting/journal-entries/frequent-postings' element={<FrequentPostings />} />

          {/* Accounting Rules */}
          <Route path='/accounting/accounting-rules' element={<AccountingRules />} />
          <Route path='/accounting/accounting-rules/view/:id' element={<ViewAccountingRules />} />

          {/* Closing Entries */} 
          <Route path='/accounting/closing-entries' element={<Closure />} />
          <Route path='/accounting/closing-entries/create' element={<CreateClosure />} />
          <Route path='/accounting/closing-entries/view/:id' element={<ViewClosure />} />
          <Route path='/accounting/closing-entries/view/:id/edit' element={<EditClosure />} />

          {/* Financial Activity Mappings */}
          <Route path='/accounting/financial-activity-mappings' element={<FinancialActivityMappings />} />
          <Route path='/accounting/financial-activity-mappings/create' element={<CreateFinancialActivityMappings />} />
          <Route path='/accounting/financial-activity-mappings/:id' element={<ViewFinancialActivityMappings />} />

          {/* Accruals */}
          <Route path='/accounting/accruals' element={<PeriodicAccruals />} />

          {/* Provision Entries */}
          <Route path='/accounting/provisioning-entries' element={<ProvisioningEntries/>}/>

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


          {/* Reports */}
          <Route path='/reports' element={<Reports />} />
          <Route path='/reports/:category' element={<Reports />} />



          {/* Admin Routes */}

          {/* User */}
          <Route path='/appusers' element={<Users />} />
          <Route path='/appusers/:id' element={<ViewUsers />} />
          <Route path='/appusers/create' element={<CreateUsers />} />
          <Route path='/appusers/:id/edit' element={<EditUsers />} />

        </Route>
      </Route>

      <Route path="*" element={<NotFound/>}/>
    </Routes>
  )
}

export default AppRoutes
