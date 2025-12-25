import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Shield, LogOut } from 'lucide-react';

export default function Settings() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [confirmDeleteValue, setConfirmDeleteValue] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [fullName, setFullName] = useState('');

  // Initialize form when profile loads
  useState(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim()) {
      updateProfileMutation.mutate(fullName.trim());
    }
  };

  const deleteAllInventoryMutation = useMutation({
    mutationFn: async () => {
      // 1) Delete all transactions (children)
      const { error: txError } = await supabase
        .from('transactions')
        .delete()
        .not('id', 'is', null);
      if (txError) throw new Error(`Delete transactions failed: ${txError.message}`);

      // 2) Delete all items (parents)
      const { error: itemError } = await supabase
        .from('items')
        .delete()
        .not('id', 'is', null);
      if (itemError) throw new Error(`Delete items failed: ${itemError.message}`);
    },
    onSuccess: () => {
      toast.success('All inventory items have been deleted');
      setConfirmDeleteValue('');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete inventory');
    },
  });

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Manage your account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={user?.email || ''} 
                disabled 
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName || profile?.full_name || ''}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <Button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account
          </CardTitle>
          <CardDescription>
            Your account details and actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-sm">{user?.id?.slice(0, 8)}...</span>
            </div>
            <Separator />
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">Admin</span>
            </div>
            <Separator />
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Created</span>
              <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</span>
            </div>
          </div>

          <Separator className="my-4" />

          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Delete all inventory items (requires confirmation)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Type <span className="font-mono">DELETE ALL</span> and click the button to remove every inventory item.
          </p>
          <Input
            placeholder="Type DELETE ALL to confirm"
            value={confirmDeleteValue}
            onChange={(e) => setConfirmDeleteValue(e.target.value)}
          />
          <Button
            variant="destructive"
            onClick={() => deleteAllInventoryMutation.mutate()}
            disabled={confirmDeleteValue !== 'DELETE ALL' || deleteAllInventoryMutation.isPending}
            className="w-full sm:w-auto"
          >
            {deleteAllInventoryMutation.isPending ? 'Deleting...' : 'Delete All Inventory'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
