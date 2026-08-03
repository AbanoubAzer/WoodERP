import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { useAuthStore } from './store/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';

import { Branches } from './pages/admin/Branches';
import { Users } from './pages/admin/Users';
import { Settings } from './pages/admin/Settings';
import { Roles } from './pages/admin/Roles';
import { Categories } from './pages/admin/catalog/Categories';
import { WoodTypes } from './pages/admin/catalog/WoodTypes';
import { Products } from './pages/admin/catalog/Products';
import { NewProduct } from './pages/admin/catalog/NewProduct';
import { Warehouses } from './pages/admin/inventory/Warehouses';
import { Inventory } from './pages/admin/inventory/Inventory';
import { ReceiveStock } from './pages/admin/inventory/ReceiveStock';
import { IssueStock } from './pages/admin/inventory/IssueStock';
import { StockTransfer } from './pages/admin/inventory/StockTransfer';
import { Customers } from './pages/admin/customers/Customers';
import { NewCustomer } from './pages/admin/customers/NewCustomer';
import { CustomerStatement } from './pages/admin/customers/CustomerStatement';
import { Suppliers } from './pages/admin/suppliers/Suppliers';
import { NewSupplier } from './pages/admin/suppliers/NewSupplier';
import { SupplierStatement } from './pages/admin/suppliers/SupplierStatement';
import { SalesInvoices } from './pages/admin/sales/SalesInvoices';
import { NewInvoice } from './pages/admin/sales/NewInvoice';
import { InvoiceView } from './pages/admin/sales/InvoiceView';
import { PurchaseInvoices } from './pages/admin/purchases/PurchaseInvoices';
import { NewPurchaseInvoice } from './pages/admin/purchases/NewPurchaseInvoice';
import { PurchaseInvoiceView } from './pages/admin/purchases/PurchaseInvoiceView';
import { InstallmentPlans } from './pages/admin/installments/InstallmentPlans';
import { NewInstallmentPlan } from './pages/admin/installments/NewInstallmentPlan';
import { InstallmentPlanView } from './pages/admin/installments/InstallmentPlanView';
import { ChartOfAccounts } from './pages/admin/accounting/ChartOfAccounts';
import { JournalEntries } from './pages/admin/accounting/JournalEntries';
import { Expenses } from './pages/admin/accounting/Expenses';
import { TreasuryAccounts } from './pages/admin/treasury/TreasuryAccounts';
import { TreasuryTransfer } from './pages/admin/treasury/TreasuryTransfer';
import { NotificationsList } from './pages/admin/notifications/NotificationsList';
import { SalesReports } from './pages/admin/reports/SalesReports';
import { AgingReports } from './pages/admin/reports/AgingReports';
import { ComprehensiveCustomerReport } from './pages/admin/reports/ComprehensiveCustomerReport';
import { SalesDateRangeReport } from './pages/admin/reports/SalesDateRangeReport';
import { InventoryMovementsReport } from './pages/admin/reports/InventoryMovementsReport';
import { PaymentMethodsSettings } from './pages/admin/settings/PaymentMethodsSettings';
import { SystemCompanies } from './pages/system/SystemCompanies';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
    <ToastContainer />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="branches" element={<Branches />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="payment-methods" element={<PaymentMethodsSettings />} />
          <Route path="roles" element={<Roles />} />
          <Route path="categories" element={<Categories />} />
          <Route path="wood-types" element={<WoodTypes />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<NewProduct />} />
          <Route path="warehouses" element={<Warehouses />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/receive" element={<ReceiveStock />} />
          <Route path="inventory/issue" element={<IssueStock />} />
          <Route path="inventory/transfer" element={<StockTransfer />} />
          <Route path="reports">
            <Route index element={<Navigate to="inventory" replace />} />
            <Route path="inventory" element={<InventoryReports />} />
            <Route path="inventory-movements" element={<InventoryMovementsReport />} />
            <Route path="sales" element={<SalesReports />} />
            <Route path="sales-advanced" element={<SalesDateRangeReport />} />
            <Route path="aging" element={<AgingReports />} />
            <Route path="customers" element={<ComprehensiveCustomerReport />} />
          </Route>
          <Route path="customers" element={<Customers />} />
          <Route path="customers/new" element={<NewCustomer />} />
          <Route path="customers/:id/statement" element={<CustomerStatement />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="suppliers/new" element={<NewSupplier />} />
          <Route path="suppliers/:id/statement" element={<SupplierStatement />} />
          
          <Route path="purchases/invoices" element={<PurchaseInvoices />} />
          <Route path="purchases/invoices/new" element={<NewPurchaseInvoice />} />
          <Route path="purchases/invoices/:id" element={<PurchaseInvoiceView />} />

          <Route path="installments" element={<InstallmentPlans />} />
          <Route path="installments/new" element={<NewInstallmentPlan />} />
          <Route path="installments/:id" element={<InstallmentPlanView />} />

          <Route path="accounting/chart-of-accounts" element={<ChartOfAccounts />} />
          <Route path="accounting/journal" element={<JournalEntries />} />
          <Route path="accounting/expenses" element={<Expenses />} />

          <Route path="treasury" element={<TreasuryAccounts />} />
          <Route path="treasury/transfer" element={<TreasuryTransfer />} />

          <Route path="notifications" element={<NotificationsList />} />

          {/* Super Admin Route */}
          <Route path="system/companies" element={<SystemCompanies />} />

          <Route path="sales/invoices" element={<SalesInvoices />} />
          <Route path="sales/invoices/new" element={<NewInvoice />} />
          <Route path="sales/invoices/:id" element={<InvoiceView />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
