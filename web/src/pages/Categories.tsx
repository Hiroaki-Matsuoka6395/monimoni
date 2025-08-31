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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  household_id: number;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setAlertMessage('カテゴリデータの取得に失敗しました');
      setAlertSeverity('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory({
      id: 0,
      name: '',
      type: 'expense',
      household_id: 1
    });
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      if (isCreateMode) {
        await apiClient.post('/categories/', {
          name: editingCategory.name.trim(),
          type: editingCategory.type,
          household_id: 1
        });
        setAlertMessage('カテゴリを作成しました');
      } else {
        await apiClient.put(`/categories/${editingCategory.id}`, {
          name: editingCategory.name.trim(),
          type: editingCategory.type
        });
        setAlertMessage('カテゴリを更新しました');
      }
      
      setAlertSeverity('success');
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      setAlertMessage('カテゴリの保存に失敗しました');
      setAlertSeverity('error');
    }
  };

  const handleDelete = async (categoryId: number, categoryName: string) => {
    if (!confirm(`カテゴリ「${categoryName}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await apiClient.delete(`/categories/${categoryId}`);
      setAlertMessage('カテゴリを削除しました');
      setAlertSeverity('success');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setAlertMessage('カテゴリの削除に失敗しました');
      setAlertSeverity('error');
    }
  };

  const getTypeChipColor = (type: string) => {
    return type === 'income' ? 'success' : 'error';
  };

  const getTypeLabel = (type: string) => {
    return type === 'income' ? '収入' : '支出';
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
          カテゴリ管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          カテゴリ追加
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>カテゴリ名</TableCell>
                  <TableCell align="center">種別</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      カテゴリが登録されていません
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getTypeLabel(category.type)}
                          color={getTypeChipColor(category.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleEdit(category)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(category.id, category.name)} 
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
          {isCreateMode ? 'カテゴリ作成' : 'カテゴリ編集'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="カテゴリ名"
              value={editingCategory?.name || ''}
              onChange={(e) => setEditingCategory(prev => prev ? {
                ...prev,
                name: e.target.value
              } : null)}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>種別</InputLabel>
              <Select
                value={editingCategory?.type || 'expense'}
                onChange={(e) => setEditingCategory(prev => prev ? {
                  ...prev,
                  type: e.target.value as 'income' | 'expense'
                } : null)}
              >
                <MenuItem value="income">収入</MenuItem>
                <MenuItem value="expense">支出</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!editingCategory?.name?.trim()}
          >
            {isCreateMode ? '作成' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Categories
