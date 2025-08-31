import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  FileUpload as ReceiptIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as ExportIcon,
} from "@mui/icons-material";
import { api } from "../api/client";

// Transaction型定義
interface Transaction {
  id: number;
  date: string;
  type: "income" | "expense" | "transfer";
  amount_total: number;
  account: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
  payer_user: { id: number; name: string } | null;
  memo: string;
  split_ratio_payer: number;
  has_receipt: boolean;
  created_at: string;
  items: Array<{
    id: number;
    name: string;
    amount: number;
    quantity: number | null;
    unit_price: number | null;
  }>;
}

interface TransactionFormData {
  date: string;
  type: "income" | "expense" | "transfer";
  amount_total: number;
  account_id: number | null;
  category_id: number | null;
  payer_user_id: number | null;
  memo: string;
  split_ratio_payer: number;
  items: Array<{
    name: string;
    amount: number;
    quantity: number | null;
    unit_price: number | null;
  }>;
}

interface Category {
  id: number;
  name: string;
  type: string;
  household_id: number;
}

interface Account {
  id: number;
  name: string;
  type: string;
  household_id: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  // マスターデータ
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // フィルター状態
  const [filters, setFilters] = useState({
    from_date: "",
    to_date: "",
    category_id: "",
    account_id: "",
    user_id: "",
    q: "",
  });

  // ダイアログ状態
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    amount_total: 0,
    account_id: null,
    category_id: null,
    payer_user_id: null,
    memo: "",
    split_ratio_payer: 50,
    items: [],
  });

  // 取引データを取得
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        size: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      };

      const response = await api.transactions.list(params);
      setTransactions(response.data.transactions);
      setTotal(response.data.total);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      setError(err.response?.data?.detail || "取引データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // マスターデータを取得
  const fetchMasterData = async () => {
    try {
      const [categoriesRes, accountsRes, usersRes] = await Promise.all([
        api.categories.list(),
        api.accounts.list(),
        api.users.list(),
      ]);

      setCategories(categoriesRes.data.categories);
      setAccounts(accountsRes.data.accounts);
      setUsers(usersRes.data.users);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  // 初回読み込み時にマスターデータを取得
  useEffect(() => {
    fetchMasterData();
  }, []);

  // 初回読み込みとフィルター変更時の再取得
  useEffect(() => {
    fetchTransactions();
  }, [page, rowsPerPage, filters]);

  // フィルター変更ハンドラー
  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [field]: value }));
    setPage(0); // ページをリセット
  };

  // ページ変更ハンドラー
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 行数変更ハンドラー
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 金額のフォーマット
  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);

    if (type === "income") {
      return `+${formatted}`;
    } else if (type === "expense") {
      return `-${formatted}`;
    }
    return formatted;
  };

  // 取引タイプの表示
  const getTypeChip = (type: string) => {
    const typeMap = {
      income: { label: "収入", color: "success" as const },
      expense: { label: "支出", color: "error" as const },
      transfer: { label: "振替", color: "info" as const },
    };
    const typeInfo = typeMap[type as keyof typeof typeMap] || {
      label: type,
      color: "default" as const,
    };

    return <Chip label={typeInfo.label} color={typeInfo.color} size="small" />;
  };

  // CSV エクスポート
  const handleExport = async () => {
    try {
      const response = await api.files.exportCSV(filters);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `transactions_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // 新規作成ハンドラー
  const handleCreateTransaction = async () => {
    try {
      setCreating(true);
      setError(null);

      // バリデーション
      if (!formData.date) {
        setError("日付は必須です");
        return;
      }
      if (!formData.amount_total || formData.amount_total <= 0) {
        setError("金額は0より大きい値を入力してください");
        return;
      }

      const response = await api.transactions.create(formData);

      if (response.status === 200) {
        setCreateDialogOpen(false);
        // フォームリセット
        setFormData({
          date: new Date().toISOString().split("T")[0],
          type: "expense",
          amount_total: 0,
          account_id: null,
          category_id: null,
          payer_user_id: null,
          memo: "",
          split_ratio_payer: 50,
          items: [],
        });
        // データ再取得
        await fetchTransactions();
      }
    } catch (err: any) {
      console.error("Error creating transaction:", err);
      setError(err.response?.data?.detail || "取引の作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  // 編集ハンドラー
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      date: transaction.date,
      type: transaction.type,
      amount_total: transaction.amount_total,
      account_id: transaction.account?.id || null,
      category_id: transaction.category?.id || null,
      payer_user_id: transaction.payer_user?.id || null,
      memo: transaction.memo,
      split_ratio_payer: transaction.split_ratio_payer * 100,
      items: transaction.items || [],
    });
    setEditDialogOpen(true);
  };

  // 更新ハンドラー
  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      setUpdating(true);
      setError(null);

      // バリデーション
      if (!formData.date) {
        setError("日付は必須です");
        return;
      }
      if (!formData.amount_total || formData.amount_total <= 0) {
        setError("金額は0より大きい値を入力してください");
        return;
      }

      const response = await api.transactions.update(
        selectedTransaction.id,
        formData
      );

      if (response.status === 200) {
        setEditDialogOpen(false);
        setSelectedTransaction(null);
        // データ再取得
        await fetchTransactions();
      }
    } catch (err: any) {
      console.error("Error updating transaction:", err);
      setError(err.response?.data?.detail || "取引の更新に失敗しました");
    } finally {
      setUpdating(false);
    }
  };

  // 削除確認ハンドラー
  const handleDeleteConfirm = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  // 削除ハンドラー
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await api.transactions.delete(selectedTransaction.id);

      if (response.status === 200) {
        setDeleteDialogOpen(false);
        setSelectedTransaction(null);
        // データ再取得
        await fetchTransactions();
      }
    } catch (err: any) {
      console.error("Error deleting transaction:", err);
      setError(err.response?.data?.detail || "取引の削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && (transactions || []).length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          取引履歴
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            sx={{ mr: 1 }}
          >
            CSV出力
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            新規作成
          </Button>
        </Box>
      </Box>

      {/* フィルター */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="開始日"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.from_date}
                onChange={(e: any) =>
                  handleFilterChange("from_date", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="終了日"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.to_date}
                onChange={(e: any) =>
                  handleFilterChange("to_date", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="検索"
                size="small"
                fullWidth
                placeholder="メモで検索"
                value={filters.q}
                onChange={(e: any) => handleFilterChange("q", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterIcon />}
                onClick={() =>
                  setFilters({
                    from_date: "",
                    to_date: "",
                    category_id: "",
                    account_id: "",
                    user_id: "",
                    q: "",
                  })
                }
              >
                リセット
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 取引テーブル */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>日付</TableCell>
                <TableCell>種別</TableCell>
                <TableCell>金額</TableCell>
                <TableCell>カテゴリ</TableCell>
                <TableCell>アカウント</TableCell>
                <TableCell>支払者</TableCell>
                <TableCell>メモ</TableCell>
                <TableCell>レシート</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(transactions || []).map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString("ja-JP")}
                  </TableCell>
                  <TableCell>{getTypeChip(transaction.type)}</TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color:
                        transaction.type === "income"
                          ? "green"
                          : transaction.type === "expense"
                            ? "red"
                            : "inherit",
                    }}
                  >
                    {formatAmount(transaction.amount_total, transaction.type)}
                  </TableCell>
                  <TableCell>{transaction.category?.name || "-"}</TableCell>
                  <TableCell>{transaction.account?.name || "-"}</TableCell>
                  <TableCell>{transaction.payer_user?.name || "-"}</TableCell>
                  <TableCell>
                    <Tooltip title={transaction.memo || "(メモなし)"}>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 150,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {transaction.memo || "-"}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {transaction.has_receipt && (
                      <Chip
                        icon={<ReceiptIcon />}
                        label="あり"
                        size="small"
                        color="primary"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="編集">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteConfirm(transaction)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {(transactions || []).length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      取引データがありません
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ページネーション */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="1ページあたりの行数:"
          labelDisplayedRows={({ from, to, count }: any) =>
            `${count} 件中 ${from}-${to} 件目`
          }
        />
      </Card>

      {/* 新規作成ダイアログ */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>新しい取引を作成</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="日付"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.date}
                  onChange={(e: any) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>種別</InputLabel>
                  <Select
                    value={formData.type}
                    label="種別"
                    onChange={(e: any) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                  >
                    <MenuItem value="expense">支出</MenuItem>
                    <MenuItem value="income">収入</MenuItem>
                    <MenuItem value="transfer">振替</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="金額"
                  fullWidth
                  value={formData.amount_total || ""}
                  onChange={(e: any) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      amount_total: e.target.value ? Number(e.target.value) : 0,
                    }))
                  }
                  inputProps={{ inputMode: "decimal", pattern: "[0-9]*" }}
                  helperText="手入力で金額を入力してください"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>カテゴリ</InputLabel>
                  <Select
                    value={formData.category_id || ""}
                    label="カテゴリ"
                    onChange={(e: any) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        category_id: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                  >
                    <MenuItem value="">選択なし</MenuItem>
                    {categories &&
                      categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>アカウント</InputLabel>
                  <Select
                    value={formData.account_id || ""}
                    label="アカウント"
                    onChange={(e: any) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        account_id: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                  >
                    <MenuItem value="">選択なし</MenuItem>
                    {accounts &&
                      accounts.map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.name} ({account.type})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>支払者</InputLabel>
                  <Select
                    value={formData.payer_user_id || ""}
                    label="支払者"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        payer_user_id: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                  >
                    <MenuItem value="">選択なし</MenuItem>
                    {users &&
                      users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="支払者負担割合"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                  value={formData.split_ratio_payer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      split_ratio_payer: Number(e.target.value),
                    }))
                  }
                  helperText="%"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="メモ"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, memo: e.target.value }))
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleCreateTransaction}
            disabled={creating || !formData.amount_total}
          >
            {creating ? <CircularProgress size={20} /> : "作成"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedTransaction(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>取引を編集</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="日付"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.date}
                  onChange={(e: any) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>取引タイプ</InputLabel>
                  <Select
                    value={formData.type}
                    label="取引タイプ"
                    onChange={(e: any) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="income">収入</MenuItem>
                    <MenuItem value="expense">支出</MenuItem>
                    <MenuItem value="transfer">振替</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="金額"
                  type="number"
                  fullWidth
                  value={formData.amount_total}
                  onChange={(e: any) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      amount_total: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>アカウント</InputLabel>
                  <Select
                    value={formData.account_id || ""}
                    label="アカウント"
                    onChange={(e: any) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        account_id: e.target.value || null,
                      }))
                    }
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    {(accounts || []).map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>カテゴリ</InputLabel>
                  <Select
                    value={formData.category_id || ""}
                    label="カテゴリ"
                    onChange={(e: any) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        category_id: e.target.value || null,
                      }))
                    }
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    {(categories || []).map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>支払者</InputLabel>
                  <Select
                    value={formData.payer_user_id || ""}
                    label="支払者"
                    onChange={(e: any) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        payer_user_id: e.target.value || null,
                      }))
                    }
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    {(users || []).map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="メモ"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.memo}
                  onChange={(e: any) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      memo: e.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setSelectedTransaction(null);
            }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateTransaction}
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : "更新"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedTransaction(null);
        }}
      >
        <DialogTitle>取引を削除</DialogTitle>
        <DialogContent>
          <Typography>
            この取引を削除してもよろしいですか？この操作は取り消せません。
          </Typography>
          {selectedTransaction && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>日付:</strong>{" "}
                {new Date(selectedTransaction.date).toLocaleDateString("ja-JP")}
              </Typography>
              <Typography variant="body2">
                <strong>金額:</strong>{" "}
                {formatAmount(
                  selectedTransaction.amount_total,
                  selectedTransaction.type
                )}
              </Typography>
              <Typography variant="body2">
                <strong>カテゴリ:</strong>{" "}
                {selectedTransaction.category?.name || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>メモ:</strong> {selectedTransaction.memo || "-"}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedTransaction(null);
            }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteTransaction}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : "削除"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* フローティングアクションボタン（モバイル用） */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          display: { xs: "flex", sm: "none" },
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default Transactions;
