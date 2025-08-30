import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Accounts: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        アカウント管理
      </Typography>
      
      <Card>
        <CardContent>
          <Typography>
            アカウント管理機能はまだ実装されていません。
          </Typography>
          <Typography variant="body2" color="textSecondary">
            TODO: 口座・カード・現金等のアカウント管理機能を実装
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Accounts
