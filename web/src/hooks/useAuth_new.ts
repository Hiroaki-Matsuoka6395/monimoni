import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'

interface User {
  user_type: string
  authenticated: boolean
  expires_at: number
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Check authentication status - 初期状態では無効化
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
    enabled: false, // 初期状態では無効化してループを防ぐ
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

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
      const response = await apiClient.post('/auth/login', { pin })
      return response.data
    },
    onSuccess: () => {
      // ログイン成功後にユーザー情報を取得
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
    },
  })

  const login = (pin: string) => {
    return loginMutation.mutateAsync(pin)
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
