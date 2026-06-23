/**
 * Add or update a login user.
 *
 * Examples:
 *   npm run add-user -- --email boss@company.com --password "MyPass123!" --name "Boss" --role Admin
 *   npm run add-user -- --email sec@company.com --password "SecPass123!" --name "Secretary" --role Assistant
 *   npm run add-user -- --email org@company.com --password "OrgPass123!" --name "Meeting Organizer" --role Organizer
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../src/models/User';

dotenv.config();

const USERS_FILE = path.join(__dirname, '../data/users.json');

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return undefined;
  }
  return process.argv[index + 1];
}

async function main(): Promise<void> {
  const email = getArg('--email');
  const password = getArg('--password');
  const name = getArg('--name');
  const role = getArg('--role') as UserRole | undefined;

  if (!email || !password || !name || !role) {
    console.error('Usage:');
    console.error(
      '  npm run add-user -- --email EMAIL --password "PASSWORD" --name "FULL NAME" --role Admin|Assistant|Organizer'
    );
    process.exit(1);
  }

  const validRoles: UserRole[] = ['Admin', 'Assistant', 'Organizer'];
  if (!role || !validRoles.includes(role)) {
    console.error('Role must be Admin, Assistant, or Organizer');
    process.exit(1);
  }

  const dataDir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let users: User[] = [];
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as User[];
  }

  const emailLower = email.toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 12);
  const existingIndex = users.findIndex((u) => u.email.toLowerCase() === emailLower);

  if (existingIndex >= 0) {
    users[existingIndex] = {
      ...users[existingIndex],
      password: hashedPassword,
      name,
      role,
    };
    console.log(`Updated user: ${email} (${role})`);
  } else {
    users.push({
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date().toISOString(),
    });
    console.log(`Created user: ${email} (${role})`);
  }

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  console.log(`Saved to ${USERS_FILE}`);
  console.log('Restart the backend if it is already running.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
