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

  // Check authentication status
  const { data: user, error, isLoading: queryLoading } = useQuery({
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    setIsAuthenticated(!!user?.authenticated)
    setIsLoading(queryLoading)
  }, [user, queryLoading])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (pin: string) => {
      const response = await apiClient.post('/auth/login', { pin })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      setIsAuthenticated(true)
    },
    onError: (error) => {
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
    logoutMutation.mutate()
  }

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
  }
}
