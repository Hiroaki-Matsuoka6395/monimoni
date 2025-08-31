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
import { apiClient } from '../api/client'

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

interface Budget {
  id: number
  category_id: number
  category_name: string
  amount_limit: number
  amount_spent: number
  amount_remaining: number
  percentage: number
  month: string
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
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 取引データを取得
        const transactionResponse = await fetch('http://localhost:8000/api/transactions/')
        if (!transactionResponse.ok) {
          throw new Error(`HTTP error! status: ${transactionResponse.status}`)
        }
        const transactionData: ApiResponse = await transactionResponse.json()
        setTransactions(transactionData.transactions)

        // 予算データを取得
        const currentMonth = new Date().toISOString().substring(0, 7).replace('-', '')
        const budgetResponse = await apiClient.get(`/budgets/?month=${currentMonth}`)
        setBudgets(budgetResponse.data.budgets)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
  if (budgets.length === 0) {
    // デフォルトの予算データ（予算が設定されていない場合）
    var budgetData = [
      { category: '食費', spent: 45000, limit: 60000, percentage: 75 },
      { category: '交通費', spent: 15000, limit: 20000, percentage: 75 },
      { category: '光熱費', spent: 18000, limit: 25000, percentage: 72 },
    ]
  } else {
    // 実際の予算データを使用
    var budgetData = budgets.map(budget => ({
      category: budget.category_name,
      spent: budget.amount_spent,
      limit: budget.amount_limit,
      percentage: budget.percentage
    }))
  }

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
              {budgetData.map((budget, index) => (
                <BudgetProgress 
                  key={index}
                  category={budget.category}
                  spent={budget.spent}
                  limit={budget.limit}
                  percentage={budget.percentage}
                />
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
