import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
} from '@mui/material'
import { LockOutlined } from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const Login: React.FC = () => {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const { login, isLoggingIn, loginError } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!pin) {
      setError('PINを入力してください')
      return
    }

    try {
      await login(pin)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'ログインに失敗しました')
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              p: 1,
              mb: 2,
            }}
          >
            <LockOutlined sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          
          <Typography component="h1" variant="h4" gutterBottom>
            MoneyMoni
          </Typography>
          
          <Typography variant="body1" color="text.secondary" gutterBottom>
            家計簿へようこそ
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            {(error || loginError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || (loginError as any)?.response?.data?.detail || 'ログインエラー'}
              </Alert>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="pin"
              label="家族PIN"
              type="password"
              id="pin"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={isLoggingIn}
              autoFocus
              inputProps={{
                maxLength: 10,
                pattern: '[0-9]*',
                inputMode: 'numeric',
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoggingIn || !pin}
              size="large"
            >
              {isLoggingIn ? 'ログイン中...' : 'ログイン'}
            </Button>
            
            <Typography variant="caption" color="text.secondary" align="center">
              家族で共有するPINコードを入力してください
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login
