import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'

interface User {
  user_type: string
  authenticated: boolean
  expires_at: number
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // ローカルストレージから認証状態を復元
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isAuthenticated') === 'true'
    }
    return false
  })
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  // Check authentication status - 完全に無効化
  const { data: user, error, isLoading: queryLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/auth/me')
        return response.data as User
      } catch (err) {
        throw err
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    enabled: false, // 完全に無効化
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // 認証状態をローカルストレージに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isAuthenticated', isAuthenticated.toString())
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (user?.authenticated) {
      setIsAuthenticated(true)
    } else if (error) {
      setIsAuthenticated(false)
    }
    setIsLoading(queryLoading)
  }, [user, error, queryLoading])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (pin: string) => {
      console.log('Attempting login with PIN:', pin)
      const response = await apiClient.post('/auth/login', { pin })
      console.log('Login response:', response.data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('Login successful, updating auth state')
      // ログイン成功時に即座に認証状態を更新
      setIsAuthenticated(true)
      setIsLoading(false)
      // ユーザー情報も取得
      console.log('Fetching user info after login')
      refetch()
    },
    onError: (error: any) => {
      console.error('Login failed:', error)
      setIsAuthenticated(false)
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout')
    },
    onSuccess: () => {
      queryClient.clear()
      setIsAuthenticated(false)
      // ローカルストレージもクリア
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isAuthenticated')
      }
    },
  })

  const login = async (pin: string) => {
    try {
      console.log('useAuth: Starting login...')
      const result = await loginMutation.mutateAsync(pin)
      console.log('useAuth: Login mutation completed')
      
      // 確実に認証状態を更新
      setIsAuthenticated(true)
      setIsLoading(false)
      
      // ローカルストレージにも保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAuthenticated', 'true')
      }
      
      console.log('useAuth: Auth state updated to true')
      return result
    } catch (error) {
      console.error('useAuth: Login failed', error)
      setIsAuthenticated(false)
      throw error
    }
  }

  const logout = () => {
    return logoutMutation.mutateAsync()
  }

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    isLoggingOut: logoutMutation.isPending,
  }
}
