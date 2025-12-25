import { useState, useMemo } from 'react';
import { Plus, Search, Download, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useItems, type Item } from '@/hooks/useInventory';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { ItemFormDialog } from '@/components/inventory/ItemFormDialog';
import { DeleteItemDialog } from '@/components/inventory/DeleteItemDialog';
import { DeleteItemsDialog } from '@/components/inventory/DeleteItemsDialog';
import { ItemDetailsDialog } from '@/components/inventory/ItemDetailsDialog';
import { ScannerDialog } from '@/components/scanner/ScannerDialog';
import { exportToExcel, exportToCSV } from '@/lib/exportInventory';
import { toast } from 'sonner';

export default function Inventory() {
  const { data: items, isLoading, error } = useItems();
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteManyDialogOpen, setDeleteManyDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailsItem, setDetailsItem] = useState<Item | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get unique categories from items
  const categories = useMemo(() => {
    if (!items) return [];
    const cats = [...new Set(items.map(item => item.category))];
    return cats.sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    return items.filter(item => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower);
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      // Type filter
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      
      // Low stock filter
      const matchesLowStock = !lowStockOnly || item.quantity_available < item.min_stock_threshold;
      
      return matchesSearch && matchesCategory && matchesType && matchesLowStock;
    });
  }, [items, searchQuery, categoryFilter, typeFilter, lowStockOnly]);

  const handleAddItem = () => {
    setSelectedItem(null);
    setFormDialogOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    setFormDialogOpen(true);
  };

  const handleDeleteItem = (item: Item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (item: Item) => {
    setDetailsItem(item);
    setDetailsOpen(true);
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (!filteredItems) return;
    setSelectedIds(checked ? new Set(filteredItems.map((i) => i.id)) : new Set());
  };

  const selectedCount = selectedIds.size;

  const handleScanResult = (item: Item) => {
    setSelectedItem(item);
    setFormDialogOpen(true);
  };

  const handleExportExcel = () => {
    if (!filteredItems.length) {
      toast.error('No items to export');
      return;
    }
    exportToExcel(filteredItems, 'inventory');
    toast.success('Exported to Excel');
  };

  const handleExportCSV = () => {
    if (!filteredItems.length) {
      toast.error('No items to export');
      return;
    }
    exportToCSV(filteredItems, 'inventory');
    toast.success('Exported to CSV');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading inventory: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Manage your lab equipment and consumables
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant={selectionMode ? 'secondary' : 'outline'} onClick={toggleSelectionMode}>
                {selectionMode ? 'Cancel Select' : 'Select'}
              </Button>
              <Button variant="outline" onClick={() => setScannerOpen(true)}>
                <QrCode className="mr-2 h-4 w-4" />
                Scan
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportExcel}>
                    Export as Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ASSET">Asset</SelectItem>
                <SelectItem value="CONSUMABLE">Consumable</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="lowStockOnly"
                checked={lowStockOnly}
                onCheckedChange={(checked) => setLowStockOnly(checked === true)}
              />
              <Label htmlFor="lowStockOnly" className="text-sm whitespace-nowrap cursor-pointer">
                Low stock only
              </Label>
            </div>
          </div>

          {/* Results count */}
          {!isLoading && items && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredItems.length} of {items.length} items
            </p>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {selectionMode && (
                <div className="flex items-center justify-between bg-muted/50 border rounded-md p-3 mb-3">
                  <span className="text-sm text-muted-foreground">
                    {selectedCount} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIds(new Set())}
                      disabled={selectedCount === 0}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteManyDialogOpen(true)}
                      disabled={selectedCount === 0}
                    >
                      Delete Selected
                    </Button>
                  </div>
                </div>
              )}
              <InventoryTable
                items={filteredItems}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onViewDetails={handleViewDetails}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleSelectAll}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ItemFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        item={selectedItem}
      />
      
      <DeleteItemDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        item={selectedItem}
      />

      <DeleteItemsDialog
        open={deleteManyDialogOpen}
        onOpenChange={setDeleteManyDialogOpen}
        itemCount={selectedCount}
        itemIds={Array.from(selectedIds)}
        onDeleted={() => {
          setSelectedIds(new Set());
          setSelectionMode(false);
        }}
      />

      <ItemDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        item={detailsItem}
      />

      <ScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onItemFound={handleScanResult}
      />
    </div>
  );
}
