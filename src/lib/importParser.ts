import * as XLSX from 'xlsx';
import type { ImportRow } from '@/components/import/ImportPreview';

const REQUIRED_FIELDS = ['name', 'sku', 'category', 'location'];
const VALID_TYPES = ['ASSET', 'CONSUMABLE'];

interface RawRow {
  name?: string;
  sku?: string;
  category?: string;
  type?: string;
  location?: string;
  quantity_total?: number | string;
  quantity_available?: number | string;
  min_stock_threshold?: number | string;
  unit_price?: number | string;
  notes?: string;
}

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function mapColumnNames(row: Record<string, unknown>): RawRow {
  const mapped: Record<string, unknown> = {};
  
  const columnMappings: Record<string, string> = {
    'name': 'name',
    'item_name': 'name',
    'item': 'name',
    'sku': 'sku',
    'sku_code': 'sku',
    'item_sku': 'sku',
    'category': 'category',
    'type': 'type',
    'item_type': 'type',
    'location': 'location',
    // common typos / variations
    'quantitiy_total': 'quantity_total',
    'quantitiy_available': 'quantity_available',
    'ölçü_vahidi': 'unit_of_measure',
    'quantity_total': 'quantity_total',
    'qty_total': 'quantity_total',
    'total_qty': 'quantity_total',
    'total': 'quantity_total',
    'quantity': 'quantity_total',
    'qty': 'quantity_total',
    'quantity_available': 'quantity_available',
    'qty_available': 'quantity_available',
    'available_qty': 'quantity_available',
    'available': 'quantity_available',
    'min_stock_threshold': 'min_stock_threshold',
    'min_stock': 'min_stock_threshold',
    'threshold': 'min_stock_threshold',
    'reorder_level': 'min_stock_threshold',
    'unit_price': 'unit_price',
    'price': 'unit_price',
    'cost': 'unit_price',
    'notes': 'notes',
    'description': 'notes',
  };

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(key);
    const mappedKey = columnMappings[normalizedKey];
    if (mappedKey) {
      mapped[mappedKey] = value;
    }
  }

  return mapped as RawRow;
}

function sanitizeText(value?: string): string {
  const text = value?.toString().trim() ?? '';
  if (!text) return '';
  // treat placeholders like "-" or "—" as empty
  if (/^-+$/.test(text)) return '';
  return text;
}

function validateRow(raw: RawRow, index: number): ImportRow {
  const errors: string[] = [];

  const parseNumber = (value: number | string | undefined | null, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const name = sanitizeText(raw.name);
  const category = sanitizeText(raw.category) || 'Uncategorized';
  const location = sanitizeText(raw.location) || 'Unassigned';

  const makeAutoSku = () => {
    const base = (name || 'ITEM')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'ITEM';
    return `AUTO-${base}-${String(index + 1).padStart(4, '0')}`;
  };

  const sku = sanitizeText(raw.sku) || makeAutoSku();

  // Required fields
  if (!name) errors.push('Name required');
  if (!sku) errors.push('SKU required');

  // Type validation
  const type = (raw.type?.toString().toUpperCase() || 'CONSUMABLE') as 'ASSET' | 'CONSUMABLE';
  if (raw.type && !VALID_TYPES.includes(type)) {
    errors.push('Type must be ASSET or CONSUMABLE');
  }

  // Numeric validations
  const quantity_total = parseNumber(raw.quantity_total, 0);
  const quantity_available = parseNumber(raw.quantity_available, quantity_total);
  const min_stock_threshold = parseNumber(raw.min_stock_threshold, 0);
  const unit_price = parseNumber(raw.unit_price, 0);

  if (quantity_total < 0) errors.push('Qty total cannot be negative');
  if (quantity_available < 0) errors.push('Qty available cannot be negative');
  if (quantity_available > quantity_total) errors.push('Qty available exceeds total');
  if (min_stock_threshold < 0) errors.push('Min stock cannot be negative');
  if (unit_price < 0) errors.push('Price cannot be negative');

  return {
    name,
    sku,
    category,
    type: VALID_TYPES.includes(type) ? type : 'CONSUMABLE',
    location,
    quantity_total,
    quantity_available: Math.min(quantity_available, quantity_total),
    min_stock_threshold,
    unit_price,
    notes: raw.notes?.toString().trim() || undefined,
    isValid: errors.length === 0,
    errors,
  };
}

export async function parseImportFile(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

        const rows = jsonData.map((rawRow, index) => {
          const mapped = mapColumnNames(rawRow);
          return validateRow(mapped, index);
        });

        resolve(rows);
      } catch (error) {
        reject(new Error('Failed to parse file. Please check the format.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };

    reader.readAsBinaryString(file);
  });
}

export function generateTemplate(): void {
  const template = [
    {
      name: 'Example Item',
      sku: 'SKU-001',
      category: 'Electronics',
      type: 'ASSET',
      location: 'Shelf A1',
      quantity_total: 10,
      quantity_available: 8,
      min_stock_threshold: 2,
      unit_price: 99.99,
      notes: 'Optional notes',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'inventory_import_template.xlsx');
}
