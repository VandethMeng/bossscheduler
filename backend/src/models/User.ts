export type UserRole = 'Admin' | 'Assistant' | 'Organizer';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
}

export interface AuthTokenPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
