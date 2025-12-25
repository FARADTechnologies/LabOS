import * as XLSX from 'xlsx';
import type { Item } from '@/hooks/useInventory';

export function exportToExcel(items: Item[], filename = 'inventory') {
  const exportData = items.map(item => ({
    'Name': item.name,
    'SKU': item.sku,
    'Category': item.category,
    'Type': item.type,
    'Location': item.location,
    'Available': item.quantity_available,
    'Total': item.quantity_total,
    'Min Stock': item.min_stock_threshold,
    'Unit Price': item.unit_price,
    'Notes': item.notes || '',
    'Created': new Date(item.created_at).toLocaleDateString(),
    'Updated': new Date(item.updated_at).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

  // Auto-size columns
  const maxWidths = Object.keys(exportData[0] || {}).map(key => ({
    wch: Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row] || '').length))
  }));
  worksheet['!cols'] = maxWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(items: Item[], filename = 'inventory') {
  const exportData = items.map(item => ({
    'Name': item.name,
    'SKU': item.sku,
    'Category': item.category,
    'Type': item.type,
    'Location': item.location,
    'Available': item.quantity_available,
    'Total': item.quantity_total,
    'Min Stock': item.min_stock_threshold,
    'Unit Price': item.unit_price,
    'Notes': item.notes || '',
    'Created': new Date(item.created_at).toLocaleDateString(),
    'Updated': new Date(item.updated_at).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
