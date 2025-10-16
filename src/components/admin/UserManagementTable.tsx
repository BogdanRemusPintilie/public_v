import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, X, Shield } from 'lucide-react';

type AppRole = 'admin' | 'moderator' | 'viewer';
type AppUserType = 'investor' | 'issuer';

interface UserData {
  user_id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  role: AppRole;
  user_type: AppUserType;
}

interface EditingState {
  [userId: string]: {
    role: AppRole;
    user_type: AppUserType;
  };
}

export const UserManagementTable = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles and user_roles separately, then join client-side
      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, email, full_name, company'),
        supabase
          .from('user_roles')
          .select('user_id, role, user_type')
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      // Create a map of user roles for quick lookup
      const rolesMap = new Map(
        rolesResult.data?.map(role => [role.user_id, role]) || []
      );

      const formattedUsers = profilesResult.data?.map((profile: any) => {
        const roleData = rolesMap.get(profile.user_id);
        return {
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          company: profile.company,
          role: (roleData?.role || 'viewer') as AppRole,
          user_type: (roleData?.user_type || 'investor') as AppUserType,
        };
      }) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (user: UserData) => {
    setEditing({
      ...editing,
      [user.user_id]: {
        role: user.role,
        user_type: user.user_type,
      },
    });
  };

  const cancelEditing = (userId: string) => {
    const newEditing = { ...editing };
    delete newEditing[userId];
    setEditing(newEditing);
  };

  const saveChanges = async (userId: string) => {
    const changes = editing[userId];
    if (!changes) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          role: changes.role,
          user_type: changes.user_type,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.user_id === userId 
          ? { ...u, role: changes.role, user_type: changes.user_type }
          : u
      ));

      cancelEditing(userId);

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const updateEditingField = (userId: string, field: 'role' | 'user_type', value: string) => {
    setEditing({
      ...editing,
      [userId]: {
        ...editing[userId],
        [field]: value as AppRole | AppUserType,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border shadow-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>User Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isEditing = !!editing[user.user_id];
            const editData = editing[user.user_id];

            return (
              <TableRow key={user.user_id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {user.email}
                    {user.role === 'admin' && (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{user.full_name || '-'}</TableCell>
                <TableCell>{user.company || '-'}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select
                      value={editData.role}
                      onValueChange={(value) => updateEditingField(user.user_id, 'role', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{user.role}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select
                      value={editData.user_type}
                      onValueChange={(value) => updateEditingField(user.user_id, 'user_type', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="issuer">Issuer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{user.user_type}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveChanges(user.user_id)}
                        className="gap-1"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelEditing(user.user_id)}
                        className="gap-1"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(user)}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
