/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
import Templates from '@/pages/templates/Templates'
import Organization from '@/pages/organization/Organization'
import Offices from '@/pages/organization/offices/Offices'
import CreateOffices from '@/pages/organization/offices/CreateOffices'
import ViewOffices from '@/pages/organization/offices/ViewOffices'
import EditOffices from '@/pages/organization/offices/EditOffices'
import Currencies from '@/pages/organization/currencies/Currencies'
import ManageCurrencies from '@/pages/organization/currencies/ManageCurrencies'
import Holidays from '@/pages/organization/holidays/Holidays'
import ManageHolidays from '@/pages/organization/holidays/ManageHolidays'
import ViewHolidays from '@/pages/organization/holidays/ViewHolidays'
import EditHolidays from '@/pages/organization/holidays/EditHolidays'
import Employees from '@/pages/organization/employees/Employees'
import CreateEmployees from '@/pages/organization/employees/CreateEmployees'
import ViewEmployees from '@/pages/organization/employees/ViewEmployees'
import EditEmployees from '@/pages/organization/employees/EditEmployees'
import BulkLoanReassignment from '@/pages/organization/bulk-loan-reassignmnet/BulkLoanReassignmnet'
import Funds from '@/pages/organization/manage-funds/ManageFunds'
import CreateFunds from '@/pages/organization/manage-funds/CreateFunds'
import ViewFunds from '@/pages/organization/manage-funds/ViewFunds'
import EditFunds from '@/pages/organization/manage-funds/EditFunds'
import Payment from '@/pages/organization/payment-types/PaymentTypes'
import CreatePaymentTypes from '@/pages/organization/payment-types/CreatePaymentTypes'
import AdhocQuery from '@/pages/organization/adhoc-query/AdhocQuery'
import CreateAdhocQuery from '@/pages/organization/adhoc-query/CreateAdhocQuery'
import ViewAdhocQuery from '@/pages/organization/adhoc-query/ViewAdhocQuery'
import EditAdhocQuery from '@/pages/organization/adhoc-query/EditAdhocQuery'
import Tellers from '@/pages/organization/tellers/Tellers'
import CreateTellers from '@/pages/organization/tellers/CreateTellers'
import ViewTellers from '@/pages/organization/tellers/ViewTellers'
import EditTellers from '@/pages/organization/tellers/EditTellers'
import Investors from '@/pages/organization/investors/Investors'
import WorkingDays from '@/pages/organization/working-days/WorkingDays'
import Products from '@/pages/products/Products'
import LoanProducts from '@/pages/products/loan-products/LoanProducts'
import CreateLoanProducts from '@/pages/products/loan-products/create-loan-products/CreateLoanProducts'
import ViewLoanProducts from '@/pages/products/loan-products/ViewLoanProducts'
import SavingsProducts from '@/pages/products/savings-products/SavingsProducts'
import CreateSavingsProducts from '@/pages/products/savings-products/create-saving-products/CreateSavingsProducts'
import ViewSavingsProducts from '@/pages/products/savings-products/ViewSavingsProducts'
import ShareProducts from '@/pages/products/share-products/ShareProducts'
import Charges from '@/pages/products/charges/Charges'
import ViewCharges from '@/pages/products/charges/ViewCharges'
import EditCharges from '@/pages/products/charges/EditCharges'
import Collaterals from '@/pages/products/collaterals/Collaterals'
import CreateCollaterals from '@/pages/products/collaterals/CreateCollaterals'
import ViewCollaterals from '@/pages/products/collaterals/ViewCollaterals'
import EditCollaterals from '@/pages/products/collaterals/EditCollaterals'
import ManageDeliquencyBuckets from '@/pages/products/manage-delinquency-buckets/ManageDeliquencyBuckets'
import CreateDelinquencyRange from '@/pages/products/manage-delinquency-buckets/delinquency-range/CreateDelinquencyRange'
import DelinquencyRange from '@/pages/products/manage-delinquency-buckets/delinquency-range/DelinquencyRange'
import ViewDelinquencyRange from '@/pages/products/manage-delinquency-buckets/delinquency-range/ViewDelinquencyRange'
import EditDelinquencyRange from '@/pages/products/manage-delinquency-buckets/delinquency-range/EditDelinquencyRange'
import DelinquencyBucket from '@/pages/products/manage-delinquency-buckets/delinquency-bucket/DelinquencyBucket'
import CreateDelinquencyBucket from '@/pages/products/manage-delinquency-buckets/delinquency-bucket/CreateDelinquencyBucket'
import ViewDelinquencyBucket from '@/pages/products/manage-delinquency-buckets/delinquency-bucket/ViewDelinquencyBucket'
import EditDelinquencyBucket from '@/pages/products/manage-delinquency-buckets/delinquency-bucket/EditDelinquencyBucket'
import ProductsMix from '@/pages/products/products-mix/ProductsMix'
import FixedDepositProducts from '@/pages/products/fixed-deposit-products/FixedDepositProducts'
import ViewFixedDepositProducts from '@/pages/products/fixed-deposit-products/ViewFixedDepositProducts'
import RecurringDepositProducts from '@/pages/products/recurring-deposit-products/RecurringDepositProducts'
import ViewRecurringDepositProducts from '@/pages/products/recurring-deposit-products/ViewRecurringDepositProducts'
import ManageTaxConfigurations from '@/pages/products/manage-tax-configurations/ManageTaxConfigurations'
import ManageTaxComponents from '@/pages/products/manage-tax-configurations/manage-tax-components/ManageTaxComponents'
import ManageTaxGroups from '@/pages/products/manage-tax-configurations/manage-tax-groups/ManageTaxGroups'
import FloatingRates from '@/pages/products/floating-rates/FloatingRates'
import ViewFloatingRates from '@/pages/products/floating-rates/ViewFloatingRates'
import System from '@/pages/system/System'
import ManageDataTables from '@/pages/system/manage-data-tables/ManageDataTables'
import ViewDataTables from '@/pages/system/manage-data-tables/ViewDataTables'
import Codes from '@/pages/system/codes/Codes'
import ViewCodes from '@/pages/system/codes/ViewCodes'
import ManageReports from '@/pages/system/manage-reports/ManageReports'
import ViewReports from '@/pages/system/manage-reports/ViewReports'
import RolesAndPermissions from '@/pages/system/roles-and-permissions/RolesAndPermissions'
import CreateRolesAndPermissions from '@/pages/system/roles-and-permissions/CreateRolesAndPermissions'
import AccountNumberPreferences from '@/pages/system/account-number-preferences/AccountNumberPreferences'
import CreateAccountNumberPreferences from '@/pages/system/account-number-preferences/CreateAccountNumberPreferences'
import ViewAccountNumberPreferences from '@/pages/system/account-number-preferences/ViewAccountNumberPreferences'
import EntityToEntityMapping from '@/pages/system/entity-to-entity-mapping/EntityToEntityMapping'
import ManageExternalEvents from '@/pages/system/manage-external-events/ManageExternalEvents'
import ManageHooks from '@/pages/system/manage-hooks/ManageHooks'
import Configurations from '@/pages/system/configurations/Configurations'
import Centers from '@/pages/centers/Centers'
import CreateCenters from '@/pages/centers/CreateCenters'
import EditCenters from '@/pages/centers/EditCenters'
import CloseCenters from '@/pages/centers/CloseCenters'
import CentersView from '@/pages/centers/centers-view/CentersView'
import CentersGeneralTab from '@/pages/centers/centers-view/general-tab/CentersGeneralTab'
import CentersNotesTab from '@/pages/centers/centers-view/notes-tab/CentersNotesTab'
import Groups from '@/pages/groups/Groups'
import CreateGroups from '@/pages/groups/CreateGroups'
import EditGroups from '@/pages/groups/groups-view/group-actions/EditGroups'
import TransferClients from '@/pages/groups/groups-view/group-actions/TransferClients'
import ManageGroupMembers from '@/pages/groups/groups-view/group-actions/ManageGroupMembers'
import AttachMeeting from '@/pages/groups/groups-view/group-actions/AttachMeeting'
import GroupsAddRoleCommitteeTab from '@/pages/groups/groups-view/commitee-tab/GroupsAddRoleCommiteeTab'
import GroupsView from '@/pages/groups/groups-view/GroupsView'
import GroupsGeneralTab from '@/pages/groups/groups-view/general-tab/GroupsGeneralTab'
import GroupsNotesTab from '@/pages/groups/groups-view/notes-tab/GroupsNotesTab'
import GroupsCommitteeTab from '@/pages/groups/groups-view/commitee-tab/GroupsCommiteeTab'
import MakeRepayment from '@/pages/loans/loans-view/loan-account-actions/make-repayment/MakeRepayment'
import AddLoanCharge from '@/pages/loans/loans-view/loan-account-actions/add-loan-charge/AddLoanCharge'
import ApproveLoan from '@/pages/loans/loans-view/loan-account-actions/approve-loan/ApproveLoan'
import WithdrawByClient from '@/pages/loans/loans-view/loan-account-actions/withdraw-by-client/WithdrawByClient'
import AddCollateral from '@/pages/loans/loans-view/loan-account-actions/add-collateral/AddCollateral'
import ViewGuarantors from '@/pages/loans/loans-view/loan-account-actions/view-guarantors/ViewGuarantors'
import CreateGuarantor from '@/pages/loans/loans-view/loan-account-actions/create-guarantor/CreateGuarantor'
import LoanScreenReports from '@/pages/loans/loans-view/loan-account-actions/loan-screen-reports/LoanScreenReports'
import AssignLoanOfficer from '@/pages/loans/loans-view/loan-account-actions/assign-loan-officer/AssignLoanOfficer'
import Disburse from '@/pages/loans/loans-view/loan-account-actions/disburse/Disburse'
import DisburseToSavingsAccount from '@/pages/loans/loans-view/loan-account-actions/disburse-to-savings-account/DisburseToSavingsAccount'
import UndoApproval from '@/pages/loans/loans-view/loan-account-actions/undo-approval/UndoApproval'
import Foreclosure from '@/pages/loans/loans-view/loan-account-actions/foreclosure/Foreclosure'
import UndoDisbursal from '@/pages/loans/loans-view/loan-account-actions/undo-disbursal/UndoDisbursal'
import AddInterestPause from '@/pages/loans/loans-view/loan-account-actions/add-interest-pause/AddInterestPause'
import PrepayLoan from '@/pages/loans/loans-view/loan-account-actions/prepay-loan/PrepayLoan'
import ChargeOff from '@/pages/loans/loans-view/loan-account-actions/charge-off/ChargeOff'
import LoanReaging from '@/pages/loans/loans-view/loan-account-actions/loan-reaging/LoanReaging'
import LoanReamortize from '@/pages/loans/loans-view/loan-account-actions/loan-reamortize/LoanReamortize'
import WaiveInterest from '@/pages/loans/loans-view/loan-account-actions/waive-interest/WaiveInterest'
import LoanReschedule from '@/pages/loans/loans-view/loan-account-actions/loan-reschedule/LoanReschedule'
import WriteOffPage from '@/pages/loans/loans-view/loan-account-actions/write-off-page/WriteOffPage'
import CloseAsRescheduled from '@/pages/loans/loans-view/loan-account-actions/close-as-rescheduled/CloseAsRescheduled'
import LoansAccountClose from '@/pages/loans/loans-view/loan-account-actions/loans-account-close/LoansAccountClose'
import SellLoan from '@/pages/loans/loans-view/loan-account-actions/sell-loan/SellLoan'
import SavingsAccountView from '@/pages/saving-product/saving-product-view/SavingProductView'
import SavingProductGeneralTab from '@/pages/saving-product/saving-product-view/general-tab/SavingProductGeneralTab'
import SavingProductTransactionTab from '@/pages/saving-product/saving-product-view/transaction-tab/SavingProductTransactionTab'
import SavingProductChargesTab from '@/pages/saving-product/saving-product-view/charges-tab/SavingProductChargesTab'
import SavingsDocumentsTab from '@/pages/saving-product/saving-product-view/savings-documents-tab/SavingsDocumentsTab'
import SavingsNotesTab from '@/pages/saving-product/saving-product-view/notes-tab/SavingsNotesTab'
import ApproveSavingAccount from '@/pages/saving-product/saving-account-actions/approve-savings-account/ApproveSavingAccount'
import RejectSavingsAccount from '@/pages/saving-product/saving-account-actions/reject-savings-account/RejectSavingsAccount'
import AddChargeSavingsAccount from '@/pages/saving-product/saving-account-actions/add-charge-savings-account/AddChargeSavingsAccount'
import SavingsAccountAssignStaff from '@/pages/saving-product/saving-account-actions/savings-account-assign-staff/SavingsAccountAssignStaff'
import ActivateSavingsAccount from '@/pages/saving-product/saving-account-actions/activate-savings-account/ActivateSavingsAccount'
import SavingsAccountTransactions from '@/pages/saving-product/saving-account-actions/savings-account-transactions/SavingsAccountTransactions'
import ManageSavingsAccount from '@/pages/saving-product/saving-account-actions/manage-savings-account/ManageSavingsAccount'
import UndoApprovalSavingsAccount from '@/pages/saving-product/saving-account-actions/undo-approval-savings-account/UndoApprovalSavingsAccount'
import LoansView from '@/pages/loans/loans-view/LoansView'
import LoansGeneralTab from '@/pages/loans/loans-view/general-tab/LoansGeneralTab'
import LoansAccountDetails from '@/pages/loans/loans-view/account-details/LoansAccountDetails'
import LoansRepaymentScheduleTab from '@/pages/loans/loans-view/repayment-schedule-tab/LoansRepaymentScheduleTab'
import LoansTransactions from '@/pages/loans/loans-view/transactions/LoansTransactions'
import LoansCollateralTab from '@/pages/loans/loans-view/loan-collateral-tab/LoansCollateralTab'
import LoansTermVariationsTab from '@/pages/loans/loans-view/loan-term-variations-tab/LoansTermVariationsTab'
import LoansDocumentsTab from '@/pages/loans/loans-view/loan-documents-tab/LoansDocumentsTab'
import LoansNotesTab from '@/pages/loans/loans-view/notes-tab/LoansNotesTab'
import ViewCharge from '@/pages/clients/clients-view/charges/view-charge/ViewCharge'
import Clients from '@/pages/clients/Clients'
import ClientsView from '@/pages/clients/clients-view/ClientsView'
import ClientsGeneralTab from '@/pages/clients/clients-view/general-tab/ClientsGeneralTab'
import ClientNotesTab from '@/pages/clients/clients-view/notes-tab/ClientsNotesTab'
import ClientsFamilyMembersAddTab from '@/pages/clients/clients-view/family-members-tab/ClientsFamilyMembersAddTab'
import ClientsDocumentsTab from '@/pages/clients/clients-view/documents-tab/ClientsDocumentsTab'
import ClientsIdentitiesTab from '@/pages/clients/clients-view/Identities-tab/ClientsidentitiesTab'
import ClientsAddressTab from '@/pages/clients/clients-view/address-tab/ClientsAddressTab'
import UndoApprovalSharesAccount from '@/pages/shares/shares-account-actions/undo-approval-shares-account/UndoApprovalSharesAccount'
import SharesAccountView from '@/pages/shares/shares-account-view/SharesAccountView'
import SharesAccountGeneralTab from '@/pages/shares/shares-account-view/general-tab/SharesAccountGeneralTab'
import SharesAccountTransactionsTab from '@/pages/shares/shares-account-view/transactions-tab/SharesAccountTransactionsTab'
import SharesAccountChargesTab from '@/pages/shares/shares-account-view/charges-tab/SharesAccountChargesTab'
import SharesAccountDividendesTab from '@/pages/shares/shares-account-view/dividends-tab/SharesAccountDividendesTab'
import ApproveSharesAccount from '@/pages/shares/shares-account-actions/approve-shares-account/ApproveSharesAccount'
import RejectSharesAccount from '@/pages/shares/shares-account-actions/reject-shares-account/RejectSharesAccount'
import ActivateSharesAccount from '@/pages/shares/shares-account-actions/activate-shares-account/ActivateSharesAccount'
import ApplyShares from '@/pages/shares/shares-account-actions/apply-shares/ApplyShares'
import RedeemShares from '@/pages/shares/shares-account-actions/redeem-shares/RedeemShares'
import CloseSharesAccount from '@/pages/shares/shares-account-actions/close-shares-account/CloseSharesAccount'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoutes />}>
        {/* Login Route */}
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          {/* Home Route */}
          <Route path="/home" element={<Home />} />

          {/* Accounting */}
          <Route path="/accounting" element={<Accounting />} />

          {/* Chart of Accounts Routes */}
          <Route
            path="accounting/chart-of-accounts"
            element={<ChartOfAccounts />}
          />
          <Route
            path="accounting/chart-of-accounts/gl-accounts/create"
            element={<CreateGlAccounts />}
          />
          <Route
            path="accounting/chart-of-accounts/gl-accounts/view/:id"
            element={<ViewGlAccounts />}
          />
          <Route
            path="accounting/chart-of-accounts/gl-accounts/view/:id/edit"
            element={<EditGlAccounts />}
          />

          {/* Journal Entries Routes */}
          <Route
            path="/accounting/journal-entries"
            element={<SearchJournalEntry />}
          />
          <Route
            path="/accounting/journal-entries/create"
            element={<CreateJournalEntry />}
          />

          {/* Frequent Postings */}
          <Route
            path="/accounting/journal-entries/frequent-postings"
            element={<FrequentPostings />}
          />

          {/* Accounting Rules */}
          <Route
            path="/accounting/accounting-rules"
            element={<AccountingRules />}
          />
          <Route
            path="/accounting/accounting-rules/view/:id"
            element={<ViewAccountingRules />}
          />

          {/* Closing Entries */}
          <Route path="/accounting/closing-entries" element={<Closure />} />
          <Route
            path="/accounting/closing-entries/create"
            element={<CreateClosure />}
          />
          <Route
            path="/accounting/closing-entries/view/:id"
            element={<ViewClosure />}
          />
          <Route
            path="/accounting/closing-entries/view/:id/edit"
            element={<EditClosure />}
          />

          {/* Financial Activity Mappings */}
          <Route
            path="/accounting/financial-activity-mappings"
            element={<FinancialActivityMappings />}
          />
          <Route
            path="/accounting/financial-activity-mappings/create"
            element={<CreateFinancialActivityMappings />}
          />
          <Route
            path="/accounting/financial-activity-mappings/:id"
            element={<ViewFinancialActivityMappings />}
          />

          {/* Accruals */}
          <Route path="/accounting/accruals" element={<PeriodicAccruals />} />

          {/* Provision Entries */}
          <Route
            path="/accounting/provisioning-entries"
            element={<ProvisioningEntries />}
          />

          {/* Notifications Routes */}
          <Route path="/notifications" element={<Notifications />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Profile and Settings */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Individual Collection Sheet Route */}
          <Route
            path="/individual-collection-sheet"
            element={<IndividualCollectionSheet />}
          />

          {/* Navigation Routes */}
          <Route path="/navigation" element={<Navigation />} />

          {/* Checker Inbox and Tasks */}
          <Route
            path="/checker-inbox-and-tasks"
            element={<CheckerInBoxAndTasks />}
          >
            <Route path="checker-inbox" element={<CheckerInboxContent />} />
            <Route path="client-approval" element={<ClientApproval />} />
            <Route path="loan-approval" element={<LoanApproval />} />
            <Route path="loan-disbursal" element={<LoanDisbursal />} />
            <Route path="reschedule-loan" element={<RescheduleLoan />} />
          </Route>

          {/* Reports */}
          <Route path="/reports/run/:reportName" element={<Reports />} />
          <Route path="/reports/:category" element={<Reports />} />
          <Route path="/reports" element={<Reports />} />

          {/* Admin Routes */}

          {/* User */}
          <Route path="/appusers" element={<Users />} />
          <Route path="/appusers/:id" element={<ViewUsers />} />
          <Route path="/appusers/create" element={<CreateUsers />} />
          <Route path="/appusers/:id/edit" element={<EditUsers />} />

          {/* Templates */}
          <Route path="/templates" element={<Templates />} />

          {/* Organization */}
          <Route path="/organization" element={<Organization />} />

          {/* Manage Offices */}
          <Route path="/organization/offices" element={<Offices />} />
          <Route
            path="/organization/offices/create"
            element={<CreateOffices />}
          />
          <Route path="/organization/offices/:id" element={<ViewOffices />} />
          <Route
            path="/organization/offices/:id/edit"
            element={<EditOffices />}
          />

          {/* Currency Configuration */}
          <Route path="/organization/currencies" element={<Currencies />} />
          <Route
            path="/organization/currencies/manage"
            element={<ManageCurrencies />}
          />

          {/* Manage Holidays */}
          <Route path="/organization/holidays" element={<Holidays />} />
          <Route
            path="/organization/holidays/create"
            element={<ManageHolidays />}
          />
          <Route path="/organization/holidays/:id" element={<ViewHolidays />} />
          <Route
            path="/organization/holidays/:id/edit"
            element={<EditHolidays />}
          />

          {/* Manage Employees */}
          <Route path="/organization/employees" element={<Employees />} />
          <Route
            path="/organization/employees/create"
            element={<CreateEmployees />}
          />
          <Route
            path="/organization/employees/:id"
            element={<ViewEmployees />}
          />
          <Route
            path="/organization/employees/:id/edit"
            element={<EditEmployees />}
          />

          {/* Bulk Loan Reasssignment */}
          <Route
            path="/organization/bulkloan"
            element={<BulkLoanReassignment />}
          />

          {/* Manage Funds */}
          <Route path="/organization/manage-funds" element={<Funds />} />
          <Route
            path="/organization/manage-funds/create"
            element={<CreateFunds />}
          />
          <Route
            path="/organization/manage-funds/:id"
            element={<ViewFunds />}
          />
          <Route
            path="/organization/manage-funds/:id/edit"
            element={<EditFunds />}
          />

          {/* Payment Types */}
          <Route path="/organization/payment-types" element={<Payment />} />
          <Route
            path="/organization/payment-types/create"
            element={<CreatePaymentTypes />}
          />

          {/* Adhoc Query */}
          <Route path="/organization/adhoc-query" element={<AdhocQuery />} />
          <Route
            path="/organization/adhoc-query/create"
            element={<CreateAdhocQuery />}
          />
          <Route
            path="/organization/adhoc-query/:id"
            element={<ViewAdhocQuery />}
          />
          <Route
            path="/organization/adhoc-query/:id/edit"
            element={<EditAdhocQuery />}
          />

          {/* Tellers */}
          <Route path="/organization/tellers" element={<Tellers />} />
          <Route
            path="/organization/tellers/create"
            element={<CreateTellers />}
          />
          <Route path="/organization/tellers/:id" element={<ViewTellers />} />
          <Route
            path="/organization/tellers/:id/edit"
            element={<EditTellers />}
          />

          {/* Investors */}
          <Route path="/organization/investors" element={<Investors />} />

          {/* Working Days */}
          <Route path="/organization/working-days" element={<WorkingDays />} />

          {/* Products */}
          <Route path="/products" element={<Products />} />

          {/* Loan Products */}
          <Route path="/products/loan-products" element={<LoanProducts />} />
          <Route
            path="/products/loan-products/create"
            element={<CreateLoanProducts />}
          />
          <Route
            path="/products/loan-products/:id/general"
            element={<ViewLoanProducts />}
          />

          {/* Savings Products */}
          <Route
            path="/products/saving-products"
            element={<SavingsProducts />}
          />
          <Route
            path="/products/saving-products/create"
            element={<CreateSavingsProducts />}
          />
          <Route
            path="/products/saving-products/:id/general"
            element={<ViewSavingsProducts />}
          />

          {/* Share Products */}
          <Route path="/products/share-products" element={<ShareProducts />} />

          {/* Charges */}
          <Route path="/products/charges" element={<Charges />} />
          <Route path="/products/charges/:id" element={<ViewCharges />} />
          <Route path="/products/charges/:id/edit" element={<EditCharges />} />

          {/* Collaterals */}
          <Route path="/products/collaterals" element={<Collaterals />} />
          <Route
            path="/products/collaterals/create"
            element={<CreateCollaterals />}
          />
          <Route
            path="/products/collaterals/:id"
            element={<ViewCollaterals />}
          />
          <Route
            path="/products/collaterals/:id/edit"
            element={<EditCollaterals />}
          />

          {/* Deliquency Buckets */}
          <Route
            path="/products/delinquency-bucket-configurations"
            element={<ManageDeliquencyBuckets />}
          />

          <Route
            path="/products/delinquency-bucket-configurations/ranges/create"
            element={<CreateDelinquencyRange />}
          />
          <Route
            path="/products/delinquency-bucket-configurations/ranges"
            element={<DelinquencyRange />}
          />
          <Route
            path="/products/delinquency-bucket-configurations/ranges/:id"
            element={<ViewDelinquencyRange />}
          />
          <Route
            path="/products/delinquency-bucket-configurations/ranges/:id/edit"
            element={<EditDelinquencyRange />}
          />

          <Route
            path="/products/delinquency-bucket-configurations/buckets"
            element={<DelinquencyBucket />}
          />
          <Route
            path="/products/delinquency-bucket-configurations/buckets/create"
            element={<CreateDelinquencyBucket />}
          />
          <Route
            path="/products/delinquency-bucket-configurations/buckets/:id"
            element={<ViewDelinquencyBucket />}
          />
          <Route
            path="/products/delinquency-bucket-configurations/buckets/:id/edit"
            element={<EditDelinquencyBucket />}
          />

          {/* Products Mix */}
          <Route path="/products/products-mix" element={<ProductsMix />} />

          {/* Fixed Deposit Products */}
          <Route
            path="/products/fixed-deposit-products"
            element={<FixedDepositProducts />}
          />
          <Route
            path="/products/fixed-deposit-products/:id/general"
            element={<ViewFixedDepositProducts />}
          />

          {/* Recurring Deposit Products */}
          <Route
            path="/products/recurring-deposit-products"
            element={<RecurringDepositProducts />}
          />
          <Route
            path="/products/recurring-deposit-products/:id/general"
            element={<ViewRecurringDepositProducts />}
          />

          {/* Manage Tax Configurations */}
          <Route
            path="/products/tax-configurations"
            element={<ManageTaxConfigurations />}
          />
          <Route
            path="/products/tax-configurations/tax-components"
            element={<ManageTaxComponents />}
          />
          <Route
            path="/products/tax-configurations/tax-groups"
            element={<ManageTaxGroups />}
          />

          {/* Floating Rates */}
          <Route path="/products/floating-rates" element={<FloatingRates />} />
          <Route
            path="/products/floating-rates/:id"
            element={<ViewFloatingRates />}
          />

          {/* Products */}
          <Route path="/system" element={<System />} />

          {/* Manage Data Tables */}
          <Route path="/system/data-tables" element={<ManageDataTables />} />
          <Route path="/system/data-tables/:id" element={<ViewDataTables />} />

          {/* Manage Codes*/}
          <Route path="/system/codes" element={<Codes />} />
          <Route path="/system/codes/:id" element={<ViewCodes />} />

          {/* Manage Reports*/}
          <Route path="/system/reports" element={<ManageReports />} />
          <Route path="/system/reports/:id" element={<ViewReports />} />

          {/* Manage Roles and Permission */}
          <Route
            path="/system/roles-and-permissions"
            element={<RolesAndPermissions />}
          />
          <Route
            path="/system/roles-and-permissions/add"
            element={<CreateRolesAndPermissions />}
          />

          {/*  Account Number Preferences */}
          <Route
            path="/system/account-number-preferences"
            element={<AccountNumberPreferences />}
          />
          <Route
            path="//system/account-number-preferences/create"
            element={<CreateAccountNumberPreferences />}
          />
          <Route
            path="/system/account-number-preferences/:id"
            element={<ViewAccountNumberPreferences />}
          />

          {/* Entity to Entity Mapping */}
          <Route
            path="/system/entity-mapping"
            element={<EntityToEntityMapping />}
          />
          {/* Manage External Event */}
          <Route
            path="/system/external-events"
            element={<ManageExternalEvents />}
          />

          {/* Configurations */}
          <Route path="/system/hooks" element={<ManageHooks />} />

          {/* Manage Hooks */}
          <Route path="/system/configurations" element={<Configurations />} />

          {/* Institution */}

          {/* Clients */}
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientsView />}>
            <Route path="general" element={<ClientsGeneralTab />} />
            <Route path="notes" element={<ClientNotesTab />} />
            <Route path="address" element={<ClientsAddressTab />} />
            <Route
              path="family-members"
              element={<ClientsFamilyMembersAddTab />}
            >
              <Route path="add" element={<ClientsFamilyMembersAddTab />} />
            </Route>
            <Route path="documents" element={<ClientsDocumentsTab />} />
            <Route path="identities" element={<ClientsIdentitiesTab />} />
          </Route>

          <Route
            path="/clients/:id/loans-accounts/:id/actions/GoodwillCredit"
            element={<MakeRepayment />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/InterestPaymentWaiver"
            element={<MakeRepayment />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/PayoutRefund"
            element={<MakeRepayment />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/MerchantIssuedRefund"
            element={<MakeRepayment />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/AddLoanCharge"
            element={<AddLoanCharge />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/Approve"
            element={<ApproveLoan />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/WithdrawnByClient"
            element={<WithdrawByClient />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/AddCollateral"
            element={<AddCollateral />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/ViewGuarantors"
            element={<ViewGuarantors />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/CreateGuarantor"
            element={<CreateGuarantor />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/LoanScreenReports"
            element={<LoanScreenReports />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/AssignLoanOfficer"
            element={<AssignLoanOfficer />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/Disburse"
            element={<Disburse />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/DisbursetoSavings"
            element={<DisburseToSavingsAccount />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/UndoApproval"
            element={<UndoApproval />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/Foreclosure"
            element={<Foreclosure />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/MakeRepayment"
            element={<MakeRepayment />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/UndoDisbursal"
            element={<UndoDisbursal />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/AddInterestPause"
            element={<AddInterestPause />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/PrepayLoan"
            element={<PrepayLoan />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/Charge-Off"
            element={<ChargeOff />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/Re-Age"
            element={<LoanReaging />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/Re-Amortize"
            element={<LoanReamortize />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/WaiveInterest"
            element={<WaiveInterest />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/Reschedule"
            element={<LoanReschedule />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/WriteOff"
            element={<WriteOffPage />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/Close-as-Rescheduled"
            element={<CloseAsRescheduled />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/Close"
            element={<LoansAccountClose />}
          />
          <Route
            path="/clients/:id/loans-accounts/:id/actions/SellLoan"
            element={<SellLoan />}
          />

          <Route
            path="/clients/:clientId/charges/:chargeId"
            element={<ViewCharge />}
          />

          <Route
            path="/clients/:groupId/savings-accounts/:accountId"
            element={<SavingsAccountView />}
          >
            <Route path="general" element={<SavingProductGeneralTab />} />
            <Route
              path="transactions"
              element={<SavingProductTransactionTab />}
            />
            <Route path="charges" element={<SavingProductChargesTab />} />
            <Route path="documents" element={<SavingsDocumentsTab />} />
            <Route path="notes" element={<SavingsNotesTab />} />
          </Route>

          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/Approve"
            element={<ApproveSavingAccount />}
          />
          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/Reject"
            element={<RejectSavingsAccount />}
          />
          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/AddCharge"
            element={<AddChargeSavingsAccount />}
          />
          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/AssignStaff"
            element={<SavingsAccountAssignStaff />}
          />
          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/Activate"
            element={<ActivateSavingsAccount />}
          />
          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/Deposit"
            element={<SavingsAccountTransactions />}
          />

          <Route
            path="/clients/:clientId/shares-accounts/:sharesAccountId"
            element={<SharesAccountView />}
          >
            <Route path="general" element={<SharesAccountGeneralTab />} />
            <Route
              path="transactions"
              element={<SharesAccountTransactionsTab />}
            />
            <Route path="charges" element={<SharesAccountChargesTab />} />
            <Route path="dividends" element={<SharesAccountDividendesTab />} />
          </Route>
          <Route
            path="/clients/:clientId/shares-accounts/:sharesAccountId/actions/Approve"
            element={<ApproveSharesAccount />}
          />
          <Route
            path="/clients/:clientId/shares-accounts/:sharesAccountId/actions/Reject"
            element={<RejectSharesAccount />}
          />
          <Route
            path="/clients/:clientId/shares-accounts/:sharesAccountId/actions/UndoApproval"
            element={<UndoApprovalSharesAccount />}
          />
          <Route
            path="/clients/:clientId/shares-accounts/:sharesAccountId/actions/Activate"
            element={<ActivateSharesAccount />}
          />
          <Route
            path="/clients/:clientId/shares-accounts/:sharesAccountId/actions/ApplyAdditionalShares"
            element={<ApplyShares />}
          />
          <Route
            path="/clients/:clientId/shares-accounts/:sharesAccountId/actions/RedeemShares"
            element={<RedeemShares />}
          />
          <Route
            path="/clients/:clientId/shares-accounts/:sharesAccountId/actions/Close"
            element={<CloseSharesAccount />}
          />

          {/* Groups */}

          <Route path="/groups/:id" element={<GroupsView />}>
            <Route path="general" element={<GroupsGeneralTab />} />
            <Route path="notes" element={<GroupsNotesTab />} />
            <Route path="committee" element={<GroupsCommitteeTab />}></Route>
          </Route>
          <Route
            path="/groups/:id/committee/add-role"
            element={<GroupsAddRoleCommitteeTab />}
          />

          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/create" element={<CreateGroups />} />
          <Route path="/groups/:id/edit" element={<EditGroups />} />
          <Route
            path="/groups/:id/actions/transfer-clients"
            element={<TransferClients />}
          />
          <Route
            path="/groups/:id/actions/manage-members"
            element={<ManageGroupMembers />}
          />
          <Route
            path="/groups/:id/actions/attach-meeting"
            element={<AttachMeeting />}
          />

          <Route
            path="/groups/:id/loans-accounts/:id/actions/GoodwillCredit"
            element={<MakeRepayment />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/InterestPaymentWaiver"
            element={<MakeRepayment />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/PayoutRefund"
            element={<MakeRepayment />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/MerchantIssuedRefund"
            element={<MakeRepayment />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/AddLoanCharge"
            element={<AddLoanCharge />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/Approve"
            element={<ApproveLoan />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/WithdrawnByClient"
            element={<WithdrawByClient />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/AddCollateral"
            element={<AddCollateral />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/ViewGuarantors"
            element={<ViewGuarantors />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/CreateGuarantor"
            element={<CreateGuarantor />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/LoanScreenReports"
            element={<LoanScreenReports />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/AssignLoanOfficer"
            element={<AssignLoanOfficer />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/Disburse"
            element={<Disburse />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/DisbursetoSavings"
            element={<DisburseToSavingsAccount />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/UndoApproval"
            element={<UndoApproval />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/Foreclosure"
            element={<Foreclosure />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/MakeRepayment"
            element={<MakeRepayment />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/UndoDisbursal"
            element={<UndoDisbursal />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/AddInterestPause"
            element={<AddInterestPause />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/PrepayLoan"
            element={<PrepayLoan />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/Charge-Off"
            element={<ChargeOff />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/Re-Age"
            element={<LoanReaging />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/Re-Amortize"
            element={<LoanReamortize />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/WaiveInterest"
            element={<WaiveInterest />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/Reschedule"
            element={<LoanReschedule />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/WriteOff"
            element={<WriteOffPage />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/Close-as-Rescheduled"
            element={<CloseAsRescheduled />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/Close"
            element={<LoansAccountClose />}
          />
          <Route
            path="/groups/:id/loans-accounts/:id/actions/SellLoan"
            element={<SellLoan />}
          />

          {/* Centers */}
          <Route path="/centers" element={<Centers />} />
          <Route path="/centers/create" element={<CreateCenters />} />
          <Route path="centers/:id/edit" element={<EditCenters />} />
          <Route path="/centers/:id/actions/close" element={<CloseCenters />} />
          <Route path="/centers/:id" element={<CentersView />}>
            <Route path="general" element={<CentersGeneralTab />} />
            <Route path="notes" element={<CentersNotesTab />} />
          </Route>

          {/* Savings Product */}
          <Route
            path="/groups/:groupId/savings-accounts/:accountId"
            element={<SavingsAccountView />}
          >
            <Route path="general" element={<SavingProductGeneralTab />} />
            <Route
              path="transactions"
              element={<SavingProductTransactionTab />}
            />
            <Route path="charges" element={<SavingProductChargesTab />} />
            <Route path="documents" element={<SavingsDocumentsTab />} />
            <Route path="notes" element={<SavingsNotesTab />} />
          </Route>

          <Route
            path="/groups/:groupId/savings-accounts/:accountId/actions/Approve"
            element={<ApproveSavingAccount />}
          />
          <Route
            path="/groups/:groupId/savings-accounts/:accountId/actions/Reject"
            element={<RejectSavingsAccount />}
          />
          <Route
            path="/groups/:groupId/savings-accounts/:accountId/actions/AddCharge"
            element={<AddChargeSavingsAccount />}
          />
          <Route
            path="/groups/:groupId/savings-accounts/:accountId/actions/AssignStaff"
            element={<SavingsAccountAssignStaff />}
          />
          <Route
            path="/groups/:groupId/savings-accounts/:accountId/actions/Activate"
            element={<ActivateSavingsAccount />}
          />
          <Route
            path="/groups/:groupId/savings-accounts/:accountId/actions/Deposit"
            element={<SavingsAccountTransactions />}
          />
          <Route
            path="/groups/:groupId/savings-accounts/:accountId/actions/Withdrawal"
            element={<SavingsAccountTransactions />}
          />
          <Route
            path="/groups/:groupId/savings-accounts/:accountId/actions/HoldAmount"
            element={<ManageSavingsAccount />}
          />
          <Route
            path="/groups/:groupId/savings-accounts/:accountId/actions/UndoApproval"
            element={<UndoApprovalSavingsAccount />}
          />

          <Route
            path="/clients/:groupId/savings-accounts/:accountId"
            element={<SavingsAccountView />}
          >
            <Route path="general" element={<SavingProductGeneralTab />} />
            <Route
              path="transactions"
              element={<SavingProductTransactionTab />}
            />
            <Route path="charges" element={<SavingProductChargesTab />} />
            <Route path="documents" element={<SavingsDocumentsTab />} />
            <Route path="notes" element={<SavingsNotesTab />} />
          </Route>

          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/Approve"
            element={<ApproveSavingAccount />}
          />
          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/Reject"
            element={<RejectSavingsAccount />}
          />
          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/AddCharge"
            element={<AddChargeSavingsAccount />}
          />
          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/AssignStaff"
            element={<SavingsAccountAssignStaff />}
          />
          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/Activate"
            element={<ActivateSavingsAccount />}
          />
          <Route
            path="/clients/:groupId/savings-accounts/:accountId/actions/Deposit"
            element={<SavingsAccountTransactions />}
          />

          {/* Loans */}
          <Route
            path="/groups/:groupId/loans-accounts/:loanId"
            element={<LoansView />}
          >
            <Route path="general" element={<LoansGeneralTab />} />
            <Route path="accountdetail" element={<LoansAccountDetails />} />
            <Route
              path="repayment-schedule"
              element={<LoansRepaymentScheduleTab />}
            />
            <Route path="transactions" element={<LoansTransactions />} />
            <Route path="loan-collateral" element={<LoansCollateralTab />} />
            <Route
              path="term-variations"
              element={<LoansTermVariationsTab />}
            />
            <Route path="loan-documents" element={<LoansDocumentsTab />} />
            <Route path="notes" element={<LoansNotesTab />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
