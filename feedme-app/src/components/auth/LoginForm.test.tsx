import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginForm from './LoginForm';

const login = vi.fn();
const push = vi.fn();

vi.mock('./AuthProvider', () => ({
  useAuth: () => ({ login }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    login.mockReset();
    push.mockReset();
  });

  it('renders login fields and redirects after a successful login', async () => {
    login.mockResolvedValue(undefined);
    render(<LoginForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Me connecter' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'secret123',
    }));
    expect(push).toHaveBeenCalledWith('/profil');
  });

  it('shows validation errors for invalid values', async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Me connecter' }));

    expect(await screen.findByText('Adresse email invalide')).toBeInTheDocument();
    expect(await screen.findByText('Mot de passe requis')).toBeInTheDocument();
  });

  it('shows authentication errors', async () => {
    login.mockRejectedValue(new Error('Email ou mot de passe incorrect'));
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Me connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect');
  });
});
