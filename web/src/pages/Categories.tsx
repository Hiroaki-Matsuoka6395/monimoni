import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Categories: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        カテゴリ管理
      </Typography>
      
      <Card>
        <CardContent>
          <Typography>
            カテゴリ管理機能はまだ実装されていません。
          </Typography>
          <Typography variant="body2" color="textSecondary">
            TODO: カテゴリ一覧、追加、編集、削除機能を実装
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Categories
