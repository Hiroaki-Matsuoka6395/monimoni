import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Category,
} from '@mui/icons-material'

interface Transaction {
  id: number
  date: string
  type: 'income' | 'expense' | 'transfer'
  amount_total: number
  account: { id: number; name: string } | null
  category: { id: number; name: string } | null
  payer_user: { id: number; name: string } | null
  memo: string
  split_ratio_payer: number
  has_receipt: boolean
  created_at: string
  items: Array<{
    id: number
    name: string
    amount: number
    quantity: number | null
    unit_price: number | null
  }>
}

interface ApiResponse {
  transactions: Transaction[]
  total: number
  page: number
  size: number
  pages: number
}

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/transactions/')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: ApiResponse = await response.json()
        setTransactions(data.transactions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // 実際のデータから統計を計算
  const calculateStats = () => {
    const thisMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const monthlyTransactions = transactions.filter(t => 
      t.date.startsWith(thisMonth)
    )
    
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount_total, 0)
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount_total, 0)

    return {
      thisMonth: {
        income,
        expenses,
        transactions: monthlyTransactions.length,
      },
      recentTransactions: transactions.slice(0, 5).map(t => ({
        id: t.id,
        date: t.date,
        memo: t.memo,
        amount: t.type === 'income' ? t.amount_total : -t.amount_total
      }))
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        エラー: {error}
      </Alert>
    )
  }

  const stats = calculateStats()

  // TODO: 予算データも実際のAPIから取得する
  const mockBudgets = [
    { category: '食費', spent: 45000, limit: 60000, percentage: 75 },
    { category: '交通費', spent: 15000, limit: 20000, percentage: 75 },
    { category: '光熱費', spent: 18000, limit: 25000, percentage: 72 },
  ]

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'primary' 
  }: { 
    title: string
    value: string | number
    icon: React.ReactNode
    color?: 'primary' | 'success' | 'error' | 'warning'
  }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h5" component="h2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  const BudgetProgress = ({ 
    category, 
    spent, 
    limit, 
    percentage 
  }: {
    category: string
    spent: number
    limit: number
    percentage: number
  }) => (
    <Box mb={2}>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body2">{category}</Typography>
        <Typography variant="body2" color="textSecondary">
          ¥{spent.toLocaleString()} / ¥{limit.toLocaleString()}
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        color={percentage > 90 ? 'error' : percentage > 75 ? 'warning' : 'primary'}
      />
    </Box>
  )

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        ダッシュボード
      </Typography>

      {/* Summary Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="今月の収入"
            value={`¥${stats.thisMonth.income.toLocaleString()}`}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="今月の支出"
            value={`¥${stats.thisMonth.expenses.toLocaleString()}`}
            icon={<TrendingDown />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="収支"
            value={`¥${(stats.thisMonth.income - stats.thisMonth.expenses).toLocaleString()}`}
            icon={<AccountBalance />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="取引数"
            value={stats.thisMonth.transactions}
            icon={<Category />}
            color="primary"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Budget Progress */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                予算の進捗
              </Typography>
              {mockBudgets.map((budget, index) => (
                <BudgetProgress key={index} {...budget} />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                最近の取引
              </Typography>
              {stats.recentTransactions.map((transaction) => (
                <Box 
                  key={transaction.id}
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  py={1}
                  borderBottom="1px solid #f0f0f0"
                >
                  <Box>
                    <Typography variant="body2">
                      {transaction.memo}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {transaction.date}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                    fontWeight="medium"
                  >
                    {transaction.amount > 0 ? '+' : ''}¥{transaction.amount.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
