import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

interface Account {
  id: number;
  name: string;
  type: string;
  household_id: number;
}

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get('/accounts/');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAlertMessage('アカウントデータの取得に失敗しました');
      setAlertSeverity('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingAccount({
      id: 0,
      name: '',
      type: '',
      household_id: 1
    });
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingAccount || !editingAccount.name.trim()) return;

    try {
      if (isCreateMode) {
        await apiClient.post('/accounts/', {
          name: editingAccount.name.trim(),
          type: editingAccount.type.trim(),
          household_id: 1
        });
        setAlertMessage('アカウントを作成しました');
      } else {
        await apiClient.put(`/accounts/${editingAccount.id}`, {
          name: editingAccount.name.trim(),
          type: editingAccount.type.trim()
        });
        setAlertMessage('アカウントを更新しました');
      }
      
      setAlertSeverity('success');
      setIsDialogOpen(false);
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      setAlertMessage('アカウントの保存に失敗しました');
      setAlertSeverity('error');
    }
  };

  const handleDelete = async (accountId: number, accountName: string) => {
    if (!confirm(`アカウント「${accountName}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await apiClient.delete(`/accounts/${accountId}`);
      setAlertMessage('アカウントを削除しました');
      setAlertSeverity('success');
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      setAlertMessage('アカウントの削除に失敗しました');
      setAlertSeverity('error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {alertMessage && (
        <Alert severity={alertSeverity} onClose={() => setAlertMessage('')} sx={{ mb: 2 }}>
          {alertMessage}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          アカウント管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          アカウント追加
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>アカウント名</TableCell>
                  <TableCell>種別</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      アカウントが登録されていません
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.type}</TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleEdit(account)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(account.id, account.name)} 
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 編集・作成ダイアログ */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isCreateMode ? 'アカウント作成' : 'アカウント編集'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="アカウント名"
              value={editingAccount?.name || ''}
              onChange={(e) => setEditingAccount(prev => prev ? {
                ...prev,
                name: e.target.value
              } : null)}
              fullWidth
              required
              placeholder="例: 三井住友銀行普通預金、現金など"
            />

            <TextField
              label="種別"
              value={editingAccount?.type || ''}
              onChange={(e) => setEditingAccount(prev => prev ? {
                ...prev,
                type: e.target.value
              } : null)}
              fullWidth
              required
              placeholder="例: 銀行口座、現金、クレジットカードなど"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!editingAccount?.name?.trim() || !editingAccount?.type?.trim()}
          >
            {isCreateMode ? '作成' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Accounts
