import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CreateUserInput, UpdateUserInput, User, UserRole } from '../types';

const roleOptions: UserRole[] = ['Admin', 'Assistant', 'Organizer'];

type FormData = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

interface UserFormDialogProps {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onCreate: (data: CreateUserInput) => Promise<void>;
  onUpdate: (data: UpdateUserInput) => Promise<void>;
  isSubmitting?: boolean;
}

const UserFormDialog = ({
  open,
  user,
  onClose,
  onCreate,
  onUpdate,
  isSubmitting = false,
}: UserFormDialogProps) => {
  const isEdit = Boolean(user);

  const schema = yup.object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Valid email is required').required('Email is required'),
    password: isEdit
      ? yup.string().test('password-length', 'Password must be at least 8 characters', (value) => {
          if (!value) return true;
          return value.length >= 8;
        })
      : yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    role: yup
      .string()
      .oneOf(roleOptions)
      .required('Role is required') as yup.Schema<UserRole>,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as never,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Organizer',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        role: user?.role ?? 'Organizer',
      });
    }
  }, [open, user, reset]);

  const handleFormSubmit = async (data: FormData) => {
    if (isEdit) {
      await onUpdate({
        name: data.name,
        email: data.email,
        role: data.role,
        ...(data.password ? { password: data.password } : {}),
      });
      return;
    }

    await onCreate({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={isEdit ? 'New Password (optional)' : 'Password'}
                    type="password"
                    fullWidth
                    error={Boolean(errors.password)}
                    helperText={
                      errors.password?.message ||
                      (isEdit ? 'Leave blank to keep current password' : 'Minimum 8 characters')
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Role"
                    fullWidth
                    error={Boolean(errors.role)}
                    helperText={errors.role?.message}
                  >
                    {roleOptions.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserFormDialog;
