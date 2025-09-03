# OpenAPI Gaps & Missing Fields Report

This document tracks missing or incorrect fields in the OpenAPI-generated interfaces used in the React migration of the Mifos X Web App. Do modify this based if you notice any additions/deletions need to be made to this list

---

## Admin Products

### `/products/loan-products/{id}/general`
**Missing in `GetLoanProductsProductIdResponse`:**
- `externalId`
- `startDate`
- `closeDate`
- `installmentInMultiplesOf`
- `repaymentStartDateType.description` (missing → wrong formatting)
- `accountMovesOutOfNPAOnlyOnArrearsCompletion`
- `holdGuaranteeFunds`
- More missing fields in description/code
- Unnecessary fields also present

### `/products/saving-products/{id}/general`
**Missing in `GetSavingsProductsProductIdResponse`:**
- `enforceMinRequiredBalance`
- `withHoldTax`
- `allowOverdraft`
- `isDormancyTrackingActive`
- Additional fields missing

### `/products/share`
- Not present in OpenAPI

### `/products/products-mix`
- `loanproducts?associations=productMixes`
- `GetLoanProductsResponse` does not include product mix data

---

## Admin Organization

### `/organization/offices`
- `GetOfficesResponse` missing `parentName`

### `/organization/currencies`
- `/v1/currencies (retrieveCurrencies)` → mapped to `ApplicationCurrencyConfigurationData`, but fetch fails
- `CurrencyData` with extra fields works instead

### `/organization/tellers/create`
- `PostTellersRequest` missing `endDate` → impossible to create tellers

### `/organization/holidays/create`
- `retrieveRepaymentScheduleUpdationTypeOptions` not mapped to any interface

### `/organization/holidays/{id}/edit`
- `GetHolidayResponse` missing `description` → cannot fetch previous value for edit

### `/organization/employees/{id}/edit`
- `UpdateStaffResponse`, `PutStaffResponse` missing required values for editing

### `/organization/tellers/{id}/edit`
- `GetTellersResponse` missing `endDate` and `description` → edit blocked

---

## Admin System

### `/system/data-tables`
- `GetDataTablesResponse` missing `entitySubType`
- Page works, but causes many TypeScript errors

### `/system/roles-and-permissions`
- `GetRolesResponse` missing `status`

---

## Institution Centers

### `/centers`
- `GetCentersResponse` → references `GetCentersPageItems`
- `GetCentersPageItems` missing:
  - `accountNo`
  - `externalId`

### `/centers/{id}/general`
- `GetCentersCenterIdResponse` missing:
  - `accountNo`
  - `externalId`
  - `activationDate`
- Causes TypeScript errors

### `/centers` (POST)
- `PostCentersRequest` incomplete → only has:
  - `name`
  - `officeId`
  - `active`
- Other required fields missing

### `/centers/{id}/notes`
- No endpoint defined in OpenAPI generator

### `/centers/{id}`
- `GetCentersCenterIdResponse` missing `staff` data

---

## Institution Groups

### `/groups`
- `GetGroupsResponse` → references `GetGroupsPageItems`
- `GetGroupsPageItems` missing:
  - `accountNo`
  - `externalId`

### `/groups` (POST)
- `PostGroupsResponse` missing:
  - `staffId`
  - `externalId`
  - `submittedOnDate`
  - `activationDate`
- Prevents group creation

---

## Institution Clients

### `/clients/{id}/charges/{chargeId}`
- `GetClientsChargesPageItems` missing `clientTransactionDatas`
