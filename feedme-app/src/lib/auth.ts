import { z } from "zod";

export const CAMPUSES = ["Campus Arch", "Autre Campus"];

const emailSchema = z
  .string()
  .trim()
  .pipe(z.email("Adresse email invalide").max(254, "254 caractères maximum"))
  .transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis").max(128, "128 caractères maximum"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Au moins 2 caractères").max(60, "60 caractères maximum"),
    email: emailSchema,
    campus: z.string().trim().min(1, "Choisis ton campus").max(100, "100 caractères maximum"),
    password: z
      .string()
      .min(8, "Au moins 8 caractères")
      .max(128, "128 caractères maximum")
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

export class AuthApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AuthApiError";
  }
}

export function resolveApiBaseUrl(configuredValue: string | undefined): string {
  const configuredUrl = configuredValue?.trim();
  if (!configuredUrl) {
    throw new AuthApiError(
      "L’API FeedMe n’est pas configurée. Définis NEXT_PUBLIC_API_URL puis redémarre le frontend."
    );
  }

  try {
    const url = new URL(configuredUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new Error("URL non autorisée");
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new AuthApiError("NEXT_PUBLIC_API_URL doit être une URL HTTP ou HTTPS valide.");
  }
}

function getApiBaseUrl(): string {
  return resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${getApiBaseUrl()}/api/v1/auth${path}`;
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new AuthApiError("Impossible de joindre l’API FeedMe. Vérifie le réseau et que le backend est démarré.");
  }

  if (!response.ok) {
    throw new AuthApiError(await getErrorMessage(response), response.status);
  }
  return response.status === 204 ? (undefined as T) : (await response.json()) as T;
}

async function getErrorMessage(response: Response): Promise<string> {
  if (response.status === 401) return "Email ou mot de passe incorrect";
  if (response.status === 409) return "Un compte existe déjà avec cet email";
  if (response.status === 429) return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (response.status === 422) {
    try {
      const body = await response.json();
      const issue = body.detail?.find?.((item: { msg?: string }) => item.msg)?.msg;
      return issue ? `Données invalides : ${issue}` : "Les informations saisies ne sont pas valides.";
    } catch {
      return "Les informations saisies ne sont pas valides.";
    }
  }
  if (response.status >= 500) return "Le service d’authentification est temporairement indisponible.";
  return "La demande n’a pas pu aboutir. Vérifie les informations saisies.";
}

export const authApi = {
  register: (input: Omit<RegisterInput, "confirm"> | RegisterInput): Promise<User> => {
    const { name, email, campus, password } = input;
    return request<User>("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, campus, password }),
    });
  },

  login: (data: LoginInput): Promise<User> =>
    request<User>("/login", { method: "POST", body: JSON.stringify(data) }),

  me: async (): Promise<User | null> => {
    try {
      return await request<User>("/me");
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) return null;
      throw error;
    }
  },

  logout: (): Promise<void> => request<void>("/logout", { method: "POST" }),
};
