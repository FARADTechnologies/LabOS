import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Pencil, Trash2, ArrowUpDown, Info } from 'lucide-react';
import type { Item } from '@/hooks/useInventory';

type SortField = 'name' | 'sku' | 'category' | 'type' | 'location' | 'quantity_available';
type SortDirection = 'asc' | 'desc';

interface InventoryTableProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onViewDetails: (item: Item) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
}

export function InventoryTable({
  items,
  onEdit,
  onDelete,
  onViewDetails,
  selectionMode = false,
  selectedIds = new Set<string>(),
  onToggleSelect,
  onToggleSelectAll,
}: InventoryTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const isLowStock = (item: Item) => item.quantity_available < item.min_stock_threshold;

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No items found. Add your first inventory item to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectionMode && (
              <TableHead className="w-[40px]">
                <Checkbox
                  aria-label="Select all"
                  checked={selectedIds.size === items.length && items.length > 0}
                  onCheckedChange={(checked) => onToggleSelectAll?.(checked === true)}
                />
              </TableHead>
            )}
            <TableHead>
              <SortButton field="name">Name</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="sku">SKU</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="category">Category</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="type">Type</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="location">Location</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="quantity_available">Available / Total</SortButton>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item) => (
            <TableRow key={item.id} className={selectedIds.has(item.id) ? 'bg-muted/50' : ''}>
              {selectionMode && (
                <TableCell className="w-[40px]">
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={(checked) => onToggleSelect?.(item.id)}
                    aria-label={`Select ${item.name}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="font-mono text-sm">{item.sku}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>
                <Badge variant={item.type === 'ASSET' ? 'default' : 'secondary'}>
                  {item.type}
                </Badge>
              </TableCell>
              <TableCell>{item.location}</TableCell>
              <TableCell>
                <span className={isLowStock(item) ? 'text-destructive font-medium' : ''}>
                  {item.quantity_available}
                </span>
                <span className="text-muted-foreground"> / {item.quantity_total}</span>
              </TableCell>
              <TableCell>
                {isLowStock(item) ? (
                  <Badge variant="destructive">Low Stock</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">In Stock</Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => onViewDetails(item)}>
                      <Info className="mr-2 h-4 w-4" />
                      Full Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(item)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
