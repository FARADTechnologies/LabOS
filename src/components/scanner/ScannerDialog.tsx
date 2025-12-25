import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BarcodeScanner } from './BarcodeScanner';
import { useItems, type Item } from '@/hooks/useInventory';
import { QrCode, Search, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface ScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemFound: (item: Item) => void;
}

export function ScannerDialog({ open, onOpenChange, onItemFound }: ScannerDialogProps) {
  const { data: items = [] } = useItems();
  const [showCamera, setShowCamera] = useState(false);
  const [manualSku, setManualSku] = useState('');

  const findItemBySku = (sku: string) => {
    const normalizedSku = sku.trim().toUpperCase();
    const item = items.find(
      i => i.sku.toUpperCase() === normalizedSku || i.sku.toUpperCase().includes(normalizedSku)
    );
    
    if (item) {
      toast.success(`Found: ${item.name}`);
      onItemFound(item);
      onOpenChange(false);
      setManualSku('');
    } else {
      toast.error(`No item found with SKU: ${sku}`);
    }
  };

  const handleScan = (result: string) => {
    setShowCamera(false);
    findItemBySku(result);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSku.trim()) {
      findItemBySku(manualSku);
    }
  };

  if (showCamera) {
    return (
      <BarcodeScanner
        onScan={handleScan}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan or Enter SKU
          </DialogTitle>
          <DialogDescription>
            Scan a barcode/QR code or manually enter an item SKU
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={() => setShowCamera(true)}
            className="w-full"
            size="lg"
          >
            <Camera className="mr-2 h-5 w-5" />
            Open Camera Scanner
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          <form onSubmit={handleManualSearch} className="flex gap-2">
            <Input
              placeholder="Enter SKU..."
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!manualSku.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
