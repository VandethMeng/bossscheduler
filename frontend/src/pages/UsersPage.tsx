import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import UserFormDialog from '../components/UserFormDialog';
import ConfirmationDialog from '../components/ConfirmationDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { CreateUserInput, UpdateUserInput, User } from '../types';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreate = async (data: CreateUserInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await userService.create(data);
      setFormOpen(false);
      setSuccess('User created successfully.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: UpdateUserInput) => {
    if (!editingUser) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await userService.update(editingUser.id, data);
      setEditingUser(null);
      setSuccess('User updated successfully.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await userService.delete(deleteTarget.id);
      setDeleteTarget(null);
      setSuccess('User deleted successfully.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add, edit, or remove login accounts. Admin only.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                Created
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUser?.id;

              return (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>
                      {user.name}
                      {isSelf ? ' (You)' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      color={
                        user.role === 'Admin'
                          ? 'primary'
                          : user.role === 'Organizer'
                            ? 'secondary'
                            : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => setEditingUser(user)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={isSelf ? 'You cannot delete yourself' : 'Delete'}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={isSelf}
                          onClick={() => setDeleteTarget(user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <UserFormDialog
        open={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? They will no longer be able to log in.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default UsersPage;
