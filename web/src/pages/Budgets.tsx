import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
} from "@mui/material";
import { Edit as EditIcon, Add as AddIcon } from "@mui/icons-material";
// import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// import { ja } from "date-fns/locale";
import { formatNumber } from "../utils/formatNumber";
import { apiClient } from "../api/client";

interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  amount_limit: number;
  amount_spent: number;
  amount_remaining: number;
  percentage: number;
  month: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

interface ChangeEvent {
  target: { value: string };
}

const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error">(
    "success"
  );

  const monthString = selectedMonth
    .toISOString()
    .substring(0, 7)
    .replace("-", "");

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [selectedMonth]);

  const fetchBudgets = async () => {
    try {
      const response = await apiClient.get(`/budgets/?month=${monthString}`);
      setBudgets(response.data.budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      setAlertMessage("予算データの取得に失敗しました");
      setAlertSeverity("error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/categories/");
      // 支出カテゴリのみフィルター
      setCategories(
        response.data.filter((cat: Category) => cat.type === "expense")
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingBudget({
      id: 0,
      category_id: 0,
      category_name: "",
      amount_limit: 0,
      amount_spent: 0,
      amount_remaining: 0,
      percentage: 0,
      month: monthString,
    });
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingBudget) return;

    try {
      if (isCreateMode) {
        await apiClient.post("/budgets/", {
          category_id: editingBudget.category_id,
          amount_limit: editingBudget.amount_limit,
          month: monthString,
        });
        setAlertMessage("予算を作成しました");
      } else {
        await apiClient.put("/budgets/", [
          {
            category_id: editingBudget.category_id,
            amount_limit: editingBudget.amount_limit,
            month: monthString,
          },
        ]);
        setAlertMessage("予算を更新しました");
      }

      setAlertSeverity("success");
      setIsDialogOpen(false);
      fetchBudgets();
    } catch (error) {
      console.error("Error saving budget:", error);
      setAlertMessage("予算の保存に失敗しました");
      setAlertSeverity("error");
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 50) return "success";
    if (percentage <= 80) return "warning";
    return "error";
  };

  const getRemainingChipColor = (remaining: number) => {
    if (remaining > 0) return "success";
    if (remaining === 0) return "warning";
    return "error";
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
        <Alert
          severity={alertSeverity}
          onClose={() => setAlertMessage("")}
          sx={{ mb: 2 }}
        >
          {alertMessage}
        </Alert>
      )}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          予算管理
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          {/* DatePicker temporarily disabled */}
          <TextField
            label="対象月"
            value={
              selectedMonth
                ? `${selectedMonth.getFullYear()}年${String(selectedMonth.getMonth() + 1).padStart(2, "0")}月`
                : ""
            }
            size="small"
            inputProps={{ readOnly: true }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            予算追加
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>カテゴリ</TableCell>
                  <TableCell align="right">予算額</TableCell>
                  <TableCell align="right">使用額</TableCell>
                  <TableCell align="right">残額</TableCell>
                  <TableCell align="center">使用率</TableCell>
                  <TableCell align="center">進捗</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {budgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      予算が設定されていません
                    </TableCell>
                  </TableRow>
                ) : (
                  budgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell>{budget.category_name}</TableCell>
                      <TableCell align="right">
                        ¥{formatNumber(budget.amount_limit)}
                      </TableCell>
                      <TableCell align="right">
                        ¥{formatNumber(budget.amount_spent)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`¥${formatNumber(budget.amount_remaining)}`}
                          color={getRemainingChipColor(budget.amount_remaining)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{budget.percentage}%</TableCell>
                      <TableCell align="center" sx={{ minWidth: 150 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(budget.percentage, 100)}
                          color={getProgressColor(budget.percentage)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleEdit(budget)}
                          size="small"
                        >
                          <EditIcon />
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
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isCreateMode ? "予算作成" : "予算編集"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={editingBudget?.category_id?.toString() || ""}
                onChange={(e: ChangeEvent) => {
                  const categoryId = Number(e.target.value);
                  const category = categories.find(
                    (cat: Category) => cat.id === categoryId
                  );
                  setEditingBudget((prev: Budget | null) =>
                    prev
                      ? {
                          ...prev,
                          category_id: categoryId,
                          category_name: category?.name || "",
                        }
                      : null
                  );
                }}
                disabled={!isCreateMode}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="予算額"
              type="number"
              value={editingBudget?.amount_limit || ""}
              onChange={(e: ChangeEvent) =>
                setEditingBudget((prev: Budget | null) =>
                  prev
                    ? {
                        ...prev,
                        amount_limit: Number(e.target.value),
                      }
                    : null
                )
              }
              fullWidth
              InputProps={{
                startAdornment: (
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    ¥
                  </Typography>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !editingBudget?.category_id || !editingBudget?.amount_limit
            }
          >
            {isCreateMode ? "作成" : "更新"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Budgets;
