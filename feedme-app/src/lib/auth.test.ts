import { beforeEach, describe, expect, it } from 'vitest';
import {
  authApi,
  loginSchema,
  registerSchema,
} from './auth';

describe('auth schemas', () => {
  it('accepts valid login data', () => {
    expect(loginSchema.safeParse({ email: 'etudiant@example.com', password: 'secret' }).success).toBe(true);
  });

  it('rejects an invalid email or an empty password', () => {
    expect(loginSchema.safeParse({ email: 'invalid', password: '' }).success).toBe(false);
  });

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse({
      name: 'Alex',
      email: 'alex@example.com',
      campus: 'Campus Arch',
      password: 'secret123',
      confirm: 'secret123',
    }).success).toBe(true);
  });

  it('rejects a weak or non-matching password', () => {
    expect(registerSchema.safeParse({
      name: 'Alex',
      email: 'alex@example.com',
      campus: 'Campus Arch',
      password: 'short',
      confirm: 'different',
    }).success).toBe(false);
  });
});

describe('mock auth API', () => {
  beforeEach(() => localStorage.clear());

  it('registers, persists and logs in a user', async () => {
    const user = await authApi.register({
      name: 'Alex',
      email: 'alex@example.com',
      campus: 'Campus Arch',
      password: 'secret123',
    });

    expect(await authApi.me()).toEqual(user);
    await authApi.logout();
    expect(await authApi.me()).toBeNull();
    expect(await authApi.login({ email: user.email, password: 'anything' })).toEqual(user);
  });

  it('rejects duplicate and unknown accounts', async () => {
    const data = { name: 'Alex', email: 'alex@example.com', campus: 'Campus Arch', password: 'secret123' };
    await authApi.register(data);

    await expect(authApi.register(data)).rejects.toThrow('Un compte existe déjà');
    await expect(authApi.login({ email: 'unknown@example.com', password: 'secret123' }))
      .rejects.toThrow('Email ou mot de passe incorrect');
  });
});
