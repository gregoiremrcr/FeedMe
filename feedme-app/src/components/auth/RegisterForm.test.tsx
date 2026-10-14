import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterForm from './RegisterForm';

const register = vi.fn();
const push = vi.fn();

vi.mock('./AuthProvider', () => ({
  useAuth: () => ({ register }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    register.mockReset();
    push.mockReset();
  });

  it('registers a user without sending the confirmation field', async () => {
    register.mockResolvedValue(undefined);
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText('Prénom ou pseudo'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText('Ton campus'), { target: { value: 'Campus Arch' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText('Confirme le mot de passe'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    await waitFor(() => expect(register).toHaveBeenCalledWith({
      name: 'Alex',
      email: 'alex@example.com',
      campus: 'Campus Arch',
      password: 'secret123',
    }));
    expect(push).toHaveBeenCalledWith('/profil');
  });

  it('shows an error when passwords do not match', async () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText('Confirme le mot de passe'), { target: { value: 'different123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(await screen.findByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });
});
