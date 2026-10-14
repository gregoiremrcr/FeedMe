import { z } from "zod";

export const CAMPUSES = ["Campus Arch", "Autre Campus"];

export const loginSchema = z.object({
  email: z.email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Au moins 2 caractères").max(60, "60 caractères maximum"),
    email: z.email("Adresse email invalide"),
    campus: z.string().min(1, "Choisis ton campus"),
    password: z
      .string()
      .min(8, "Au moins 8 caractères")
      .regex(/[A-Za-z]/, "Au moins une lettre")
      .regex(/\d/, "Au moins un chiffre"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Les mots de passe ne correspondent pas",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type User = {
  id: string;
  name: string;
  email: string;
  campus: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1/auth${path}`, {
    ...init,
    credentials: "include", // envoie et reçoit le cookie httpOnly
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Email ou mot de passe incorrect" : "Une erreur est survenue");
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

/* ------------------------------------------------------------------
 * MODE SIMULÉ (temporaire) : actif tant que NEXT_PUBLIC_API_URL est absent.
 * Les comptes sont gardés dans le navigateur, SANS mot de passe : n'importe
 * quel mot de passe est accepté pour un email déjà inscrit. À supprimer
 * dès que l'API d'authentification existe.
 * ---------------------------------------------------------------- */
const USERS_KEY = "feedme-mock-users";
const SESSION_KEY = "feedme-mock-session";

const readUsers = (): User[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const mock = {
  async register({ name, email, campus }: Omit<RegisterInput, "password" | "confirm">): Promise<User> {
    const users = readUsers();
    if (users.some((u) => u.email === email)) throw new Error("Un compte existe déjà avec cet email");
    const user = { id: crypto.randomUUID(), name, email, campus };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  },
  async login({ email }: LoginInput): Promise<User> {
    const user = readUsers().find((u) => u.email === email);
    if (!user) throw new Error("Email ou mot de passe incorrect");
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  },
  async me(): Promise<User | null> {
    const id = localStorage.getItem(SESSION_KEY);
    return readUsers().find((u) => u.id === id) ?? null;
  },
  async logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};

/* ------------------------------------------------------------------ */

export const authApi = {
  register: (data: Omit<RegisterInput, "confirm">): Promise<User> =>
    API_URL ? request<User>("/register", { method: "POST", body: JSON.stringify(data) }) : mock.register(data),

  login: (data: LoginInput): Promise<User> =>
    API_URL ? request<User>("/login", { method: "POST", body: JSON.stringify(data) }) : mock.login(data),

  me: async (): Promise<User | null> => {
    if (!API_URL) return mock.me();
    try {
      return await request<User>("/me");
    } catch {
      return null; // pas connecté
    }
  },

  logout: (): Promise<void> =>
    API_URL ? request<void>("/logout", { method: "POST" }) : mock.logout(),
};