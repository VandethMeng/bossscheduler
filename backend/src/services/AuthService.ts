import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { AuthTokenPayload, CreateUserInput, UpdateUserInput, User, UserPublic } from '../models/User';

const USERS_FILE = path.join(__dirname, '../../data/users.json');

export class AuthService {
  private users: User[] = [];

  async initialize(): Promise<void> {
    await this.loadUsers();

    if (this.users.length === 0) {
      await this.seedDefaultUsers();
    }
  }

  private async loadUsers(): Promise<void> {
    try {
      const dataDir = path.dirname(USERS_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        this.users = JSON.parse(data);
      }
    } catch {
      this.users = [];
    }
  }

  private async saveUsers(): Promise<void> {
    const dataDir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
  }

  private async seedDefaultUsers(): Promise<void> {
    const now = new Date().toISOString();

    const adminPassword = await bcrypt.hash(env.defaultUsers.admin.password, 12);
    const assistantPassword = await bcrypt.hash(
      env.defaultUsers.assistant.password,
      12
    );

    this.users = [
      {
        id: uuidv4(),
        email: env.defaultUsers.admin.email,
        password: adminPassword,
        name: env.defaultUsers.admin.name,
        role: 'Admin',
        createdAt: now,
      },
      {
        id: uuidv4(),
        email: env.defaultUsers.assistant.email,
        password: assistantPassword,
        name: env.defaultUsers.assistant.name,
        role: 'Assistant',
        createdAt: now,
      },
    ];

    await this.saveUsers();
    console.log('Default users seeded successfully.');
  }

  async login(email: string, password: string): Promise<{ token: string; user: UserPublic }> {
    const user = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const payload: AuthTokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    } as jwt.SignOptions);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  private toPublic(user: User): UserPublic {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  getUsers(): UserPublic[] {
    return this.users.map((user) => this.toPublic(user));
  }

  async createUser(input: CreateUserInput): Promise<UserPublic> {
    const emailLower = input.email.toLowerCase();
    const exists = this.users.some((u) => u.email.toLowerCase() === emailLower);

    if (exists) {
      throw new ApiError(409, 'A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const newUser: User = {
      id: uuidv4(),
      email: input.email.trim(),
      password: hashedPassword,
      name: input.name.trim(),
      role: input.role,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    await this.saveUsers();

    return this.toPublic(newUser);
  }

  async updateUser(
    id: string,
    input: UpdateUserInput,
    requesterId: string
  ): Promise<UserPublic> {
    const index = this.users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new ApiError(404, 'User not found');
    }

    const current = this.users[index];

    if (input.email) {
      const emailLower = input.email.toLowerCase();
      const emailTaken = this.users.some(
        (u) => u.id !== id && u.email.toLowerCase() === emailLower
      );

      if (emailTaken) {
        throw new ApiError(409, 'A user with this email already exists');
      }
    }

    const nextRole = input.role ?? current.role;

    if (current.role === 'Admin' && nextRole !== 'Admin') {
      const adminCount = this.users.filter((u) => u.role === 'Admin').length;
      if (adminCount <= 1) {
        throw new ApiError(400, 'Cannot remove the last admin user');
      }
    }

    if (id === requesterId && nextRole !== 'Admin') {
      throw new ApiError(400, 'You cannot change your own role from Admin');
    }

    const updated: User = {
      ...current,
      email: input.email?.trim() ?? current.email,
      name: input.name?.trim() ?? current.name,
      role: nextRole,
    };

    if (input.password) {
      updated.password = await bcrypt.hash(input.password, 12);
    }

    this.users[index] = updated;
    await this.saveUsers();

    return this.toPublic(updated);
  }

  async deleteUser(id: string, requesterId: string): Promise<UserPublic> {
    const index = this.users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new ApiError(404, 'User not found');
    }

    if (id === requesterId) {
      throw new ApiError(400, 'You cannot delete your own account');
    }

    const target = this.users[index];

    if (target.role === 'Admin') {
      const adminCount = this.users.filter((u) => u.role === 'Admin').length;
      if (adminCount <= 1) {
        throw new ApiError(400, 'Cannot delete the last admin user');
      }
    }

    const [deleted] = this.users.splice(index, 1);
    await this.saveUsers();

    return this.toPublic(deleted);
  }

  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    } catch {
      throw new ApiError(401, 'Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
