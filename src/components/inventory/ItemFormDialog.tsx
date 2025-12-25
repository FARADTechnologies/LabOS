import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateItem, useUpdateItem, type Item } from '@/hooks/useInventory';
import { toast } from 'sonner';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  category: z.string().min(1, 'Category is required').max(50),
  type: z.enum(['ASSET', 'CONSUMABLE']),
  location: z.string().min(1, 'Location is required').max(100),
  quantity_total: z.coerce.number().int().min(0, 'Must be 0 or greater'),
  quantity_available: z.coerce.number().int().min(0, 'Must be 0 or greater'),
  min_stock_threshold: z.coerce.number().int().min(0, 'Must be 0 or greater'),
  unit_price: z.coerce.number().min(0, 'Must be 0 or greater'),
  notes: z.string().max(500).optional(),
}).refine(data => data.quantity_available <= data.quantity_total, {
  message: 'Available quantity cannot exceed total quantity',
  path: ['quantity_available'],
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
}

export function ItemFormDialog({ open, onOpenChange, item }: ItemFormDialogProps) {
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const isEditing = !!item;

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      type: 'CONSUMABLE',
      location: '',
      quantity_total: 0,
      quantity_available: 0,
      min_stock_threshold: 5,
      unit_price: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        sku: item.sku,
        category: item.category,
        type: item.type,
        location: item.location,
        quantity_total: item.quantity_total,
        quantity_available: item.quantity_available,
        min_stock_threshold: item.min_stock_threshold,
        unit_price: Number(item.unit_price),
        notes: item.notes || '',
      });
    } else {
      form.reset({
        name: '',
        sku: '',
        category: '',
        type: 'CONSUMABLE',
        location: '',
        quantity_total: 0,
        quantity_available: 0,
        min_stock_threshold: 5,
        unit_price: 0,
        notes: '',
      });
    }
  }, [item, form]);

  const onSubmit = async (values: ItemFormValues) => {
    try {
      if (isEditing && item) {
        await updateItem.mutateAsync({ id: item.id, ...values });
        toast.success('Item updated successfully');
      } else {
        await createItem.mutateAsync({
          name: values.name,
          sku: values.sku,
          category: values.category,
          type: values.type,
          location: values.location,
          quantity_total: values.quantity_total,
          quantity_available: values.quantity_available,
          min_stock_threshold: values.min_stock_threshold,
          unit_price: values.unit_price,
          notes: values.notes || null,
        });
        toast.success('Item created successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const isLoading = createItem.isPending || updateItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chemicals, Equipment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CONSUMABLE">Consumable</SelectItem>
                        <SelectItem value="ASSET">Asset</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cabinet A, Shelf 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity_available"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_stock_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Stock Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="unit_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this item..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
