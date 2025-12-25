import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle } from 'lucide-react';

export interface ImportRow {
  name: string;
  sku: string;
  category: string;
  type: 'ASSET' | 'CONSUMABLE';
  location: string;
  quantity_total: number;
  quantity_available: number;
  min_stock_threshold: number;
  unit_price: number;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

interface ImportPreviewProps {
  rows: ImportRow[];
}

export function ImportPreview({ rows }: ImportPreviewProps) {
  const validCount = rows.filter(r => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          {validCount} valid
        </Badge>
        {invalidCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {invalidCount} with errors
          </Badge>
        )}
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Qty Total</TableHead>
              <TableHead>Qty Avail</TableHead>
              <TableHead>Min Stock</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index} className={!row.isValid ? 'bg-destructive/10' : ''}>
                <TableCell>
                  {row.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{row.name || '-'}</TableCell>
                <TableCell>{row.sku || '-'}</TableCell>
                <TableCell>{row.category || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.type || '-'}</Badge>
                </TableCell>
                <TableCell>{row.location || '-'}</TableCell>
                <TableCell>{row.quantity_total ?? '-'}</TableCell>
                <TableCell>{row.quantity_available ?? '-'}</TableCell>
                <TableCell>{row.min_stock_threshold ?? '-'}</TableCell>
                <TableCell>${row.unit_price?.toFixed(2) ?? '-'}</TableCell>
                <TableCell className="max-w-[200px] truncate">{row.notes || '-'}</TableCell>
                <TableCell className="text-destructive text-xs max-w-[200px]">
                  {row.errors.join(', ')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
