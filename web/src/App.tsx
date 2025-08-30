import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { Layout } from './components/Layout'
import { useAuth } from './hooks/useAuth'

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Transactions = React.lazy(() => import('./pages/Transactions'))
const Categories = React.lazy(() => import('./pages/Categories'))
const Accounts = React.lazy(() => import('./pages/Accounts'))
const Budgets = React.lazy(() => import('./pages/Budgets'))
const Login = React.lazy(() => import('./pages/Login'))

const LoadingSpinner = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="50vh"
  >
    <CircularProgress />
  </Box>
)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // 一時的に認証を無効化
  return <>{children}</>
  
  // const { isAuthenticated, isLoading } = useAuth()
  
  // if (isLoading) {
  //   return <LoadingSpinner />
  // }
  
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />
  // }
  
  // return <>{children}</>
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  )
}

export default App
