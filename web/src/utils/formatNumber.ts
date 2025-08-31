/**
 * 数値を日本の通貨形式でフォーマットする
 * @param value - フォーマットする数値
 * @returns フォーマットされた文字列
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('ja-JP');
};

/**
 * 通貨形式でフォーマットする（円記号付き）
 * @param value - フォーマットする数値
 * @returns フォーマットされた文字列（￥記号付き）
 */
export const formatCurrency = (value: number): string => {
  return `¥${formatNumber(value)}`;
};
