import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Budgets: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        予算管理
      </Typography>
      
      <Card>
        <CardContent>
          <Typography>
            予算管理機能はまだ実装されていません。
          </Typography>
          <Typography variant="body2" color="textSecondary">
            TODO: 月別予算設定、進捗追跡機能を実装
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Budgets
