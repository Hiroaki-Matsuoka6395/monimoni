import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Transactions: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        取引履歴
      </Typography>
      
      <Card>
        <CardContent>
          <Typography>
            取引一覧機能はまだ実装されていません。
          </Typography>
          <Typography variant="body2" color="textSecondary">
            TODO: データグリッド、フィルタ、新規作成フォームを実装
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Transactions
