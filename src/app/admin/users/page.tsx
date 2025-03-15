"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ArrowLeft, Search, UserPlus, User, Shield, Trash2, CheckCircle, XCircle, RefreshCw, Edit, AlertCircle } from 'lucide-react';

// User interface
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
  urlsCreated?: number;
}

export default function UsersManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false
  });
  
  // Check if user is admin
  const isAdmin = !!session?.user?.isAdmin;
  
  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      
      // In development, use mock data
      if (process.env.NODE_ENV !== 'production') {
        const mockUsers = generateMockUsers();
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Generate mock users for development
  const generateMockUsers = (): User[] => {
    return [
      {
        id: 'test-user-id-123',
        name: 'Admin User',
        email: 'admin@example.com',
        image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
        isAdmin: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        urlsCreated: 5
      },
      {
        id: 'user-2',
        name: 'Regular User',
        email: 'user@example.com',
        isAdmin: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        lastLogin: new Date(Date.now() - 3600000).toISOString(),
        urlsCreated: 12
      },
      {
        id: 'user-3',
        name: 'New User',
        email: 'new@example.com',
        isAdmin: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        urlsCreated: 0
      }
    ];
  };
  
  // Filter users based on search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const lowerCaseQuery = query.toLowerCase();
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(lowerCaseQuery) ||
      user.email.toLowerCase().includes(lowerCaseQuery) ||
      user.id.toLowerCase().includes(lowerCaseQuery)
    );
    
    setFilteredUsers(filtered);
  };
  
  // Open edit dialog for a user
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password field
      isAdmin: user.isAdmin
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog for a user
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  // Create a new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation
      if (!newUser.name || !newUser.email || !newUser.password) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // In development, simulate API call
      if (process.env.NODE_ENV !== 'production') {
        const mockUser: User = {
          id: `user-${Date.now()}`,
          name: newUser.name,
          email: newUser.email,
          isAdmin: newUser.isAdmin,
          createdAt: new Date().toISOString(),
          urlsCreated: 0
        };
        
        setUsers([...users, mockUser]);
        setFilteredUsers([...users, mockUser]);
        setIsCreateDialogOpen(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          isAdmin: false
        });
        
        toast.success('User created successfully');
        return;
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }
      
      toast.success('User created successfully');
      setIsCreateDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        isAdmin: false
      });
      
      // Refresh user list
      fetchUsers();
      
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    }
  };
  
  // Update a user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      // Validation
      if (!editUser.name || !editUser.email) {
        toast.error('Name and email are required');
        return;
      }
      
      // In development, simulate API call
      if (process.env.NODE_ENV !== 'production') {
        const updatedUsers = users.map(user => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              name: editUser.name,
              email: editUser.email,
              isAdmin: editUser.isAdmin
            };
          }
          return user;
        });
        
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setIsEditDialogOpen(false);
        
        toast.success('User updated successfully');
        return;
      }
      
      const payload = {
        ...editUser,
        id: selectedUser.id,
        // Only include password if it was changed
        ...(editUser.password ? { password: editUser.password } : {})
      };
      
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }
      
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      
      // Refresh user list
      fetchUsers();
      
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    }
  };
  
  // Delete a user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // In development, simulate API call
      if (process.env.NODE_ENV !== 'production') {
        const updatedUsers = users.filter(user => user.id !== selectedUser.id);
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setIsDeleteDialogOpen(false);
        
        toast.success('User deleted successfully');
        return;
      }
      
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      
      // Refresh user list
      fetchUsers();
      
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };
  
  // Format timestamp for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  // Load users on mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);
  
  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <main className="flex min-h-screen flex-col p-4 md:p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page. Only administrators can manage users.
            </AlertDescription>
          </Alert>
          <Button
            className="mt-4"
            onClick={() => router.push('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </main>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col p-4 md:p-8">
        <div className="flex items-center gap-2 mb-8">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">User Management</h1>
          <Badge variant="outline" className="ml-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 border-yellow-300">
            Admin
          </Badge>
        </div>
        
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={fetchUsers}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Add a new user to the system. They will receive an email with their login details.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input 
                            id="name" 
                            placeholder="Full Name" 
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="user@example.com" 
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input 
                            id="password" 
                            type="password" 
                            placeholder="••••••••" 
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="admin-mode"
                            checked={newUser.isAdmin}
                            onCheckedChange={(checked: boolean) => setNewUser({ ...newUser, isAdmin: checked })}
                          />
                          <Label htmlFor="admin-mode">Admin Privileges</Label>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Create User</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="mt-4 relative">
                <Input
                  type="text"
                  placeholder="Search users by name, email or ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>URLs Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {user.name}
                              {user.isAdmin && (
                                <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-300">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.lastLogin ? (
                              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-500">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>{formatDate(user.lastLogin)}</TableCell>
                          <TableCell>{user.urlsCreated || 0}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => openEditDialog(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {user.id !== session?.user?.id && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="text-red-500"
                                  onClick={() => openDeleteDialog(user)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No users found. Create a new user to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input 
                  id="edit-name" 
                  placeholder="Full Name" 
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  placeholder="user@example.com" 
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password (leave empty to keep unchanged)</Label>
                <Input 
                  id="edit-password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="edit-admin-mode"
                  checked={editUser.isAdmin}
                  onCheckedChange={(checked: boolean) => setEditUser({ ...editUser, isAdmin: checked })}
                  disabled={selectedUser?.id === session?.user?.id} // Prevent removing admin from self
                />
                <Label htmlFor="edit-admin-mode">
                  Admin Privileges
                  {selectedUser?.id === session?.user?.id && (
                    <span className="text-xs text-gray-500 ml-2">(Cannot remove from yourself)</span>
                  )}
                </Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete User Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800 mb-4">
              <p><strong>Name:</strong> {selectedUser?.name}</p>
              <p><strong>Email:</strong> {selectedUser?.email}</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Toaster />
      </main>
    </ProtectedRoute>
  );
} 