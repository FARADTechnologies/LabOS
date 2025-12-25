import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Item } from '@/hooks/useInventory';

interface ItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
}

export function ItemDetailsDialog({ open, onOpenChange, item }: ItemDetailsDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{item.name}</span>
            <Badge variant={item.type === 'ASSET' ? 'default' : 'secondary'}>{item.type}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <Detail label="SKU" value={item.sku} />
            <Detail label="Category" value={item.category} />
            <Detail label="Location" value={item.location} />
            <Detail label="Unit Price" value={`$${Number(item.unit_price).toFixed(2)}`} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Detail label="Total Quantity" value={item.quantity_total} />
            <Detail label="Available" value={item.quantity_available} />
            <Detail label="Low Stock Threshold" value={item.min_stock_threshold} />
          </div>

          <Separator />
          <Detail label="Notes" value={item.notes || 'No notes'} fullWidth />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value, fullWidth = false }: { label: string; value: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'col-span-3' : ''}>
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
  );
}
