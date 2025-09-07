import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './config/azureAd'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductViewPage'
import ProfilePage from './pages/ProfilePage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminRoute from './components/AdminRoute'
// import NotFound from './pages/NotFound'

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <ToastProvider position="top-right" maxToasts={5}>
          <Router>
            <div className="App">
              <Routes>
                {/* Home Route */}
                <Route path="/" element={<HomePage />} />
                
                {/* Product Detail Route */}
                <Route path="/product/:id" element={<ProductPage />} />
                
                {/* Profile Route */}
                <Route path="/profile" element={<ProfilePage />} />
                
                {/* Checkout Route */}
                <Route path="/checkout" element={<CheckoutPage />} />
                
                {/* Order Confirmation Route */}
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                
                {/* Admin Dashboard Route */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                
                {/* 404 Not Found Route */}
                {/* <Route path="*" element={<NotFound />} /> */}
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </MsalProvider>
  )
}

export default App