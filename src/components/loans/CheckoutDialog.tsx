import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCheckoutItem } from '@/hooks/useLoans';
import { useItems, type Item } from '@/hooks/useInventory';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  item_id: z.string().min(1, 'Please select an item'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  user_name: z.string().trim().min(1, 'User name is required').max(100),
  project_name: z.string().trim().min(1, 'Project name is required').max(100),
  notes: z.string().max(500).optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedItem?: Item;
}

export function CheckoutDialog({ open, onOpenChange, preselectedItem }: CheckoutDialogProps) {
  const { data: items = [] } = useItems();
  const checkoutItem = useCheckoutItem();
  
  const availableItems = items.filter(item => item.quantity_available > 0);
  
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      item_id: preselectedItem?.id || '',
      quantity: 1,
      user_name: '',
      project_name: '',
      notes: '',
    },
  });

  const selectedItemId = form.watch('item_id');
  const selectedItem = items.find(item => item.id === selectedItemId);
  const maxQuantity = selectedItem?.quantity_available || 1;

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      await checkoutItem.mutateAsync({
        item_id: data.item_id,
        quantity: data.quantity,
        user_name: data.user_name,
        project_name: data.project_name,
        notes: data.notes || null,
      });
      toast.success('Item checked out successfully');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to checkout item');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Checkout Equipment</DialogTitle>
          <DialogDescription>
            Check out equipment for a user and project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.sku}) - {item.quantity_available} available
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (max: {maxQuantity})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={maxQuantity}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="user_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Borrower Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter borrower's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="project_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project / Purpose</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={checkoutItem.isPending}>
                {checkoutItem.isPending ? 'Processing...' : 'Checkout'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
