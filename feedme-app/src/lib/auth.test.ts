import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, authApi, loginSchema, registerSchema, resolveApiBaseUrl } from "./auth";

const user = {
  id: "user-1",
  name: "Alex",
  email: "alex@example.com",
  campus: "Campus Arch",
};

describe("auth schemas", () => {
  it("accepts valid login data and normalizes email", () => {
    expect(loginSchema.parse({ email: " Alex@Example.com ", password: "secret" }).email)
      .toBe("alex@example.com");
  });

  it("rejects an invalid email or an empty password", () => {
    expect(loginSchema.safeParse({ email: "invalid", password: "" }).success).toBe(false);
  });

  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      campus: "Campus Arch",
      password: "secret123",
      confirm: "secret123",
    }).success).toBe(true);
  });

  it("rejects a weak or non-matching password", () => {
    expect(registerSchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      campus: "Campus Arch",
      password: "short",
      confirm: "different",
    }).success).toBe(false);
  });
});

describe("auth API client", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("registers through the backend with credentials and without confirmation", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(user), { status: 201 }));
    const registration = {
      name: "Alex",
      email: "alex@example.com",
      campus: "Campus Arch",
      password: "secret123",
      confirm: "secret123",
    };

    await expect(authApi.register(registration)).resolves.toEqual(user);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/register",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          name: registration.name,
          email: registration.email,
          campus: registration.campus,
          password: registration.password,
        }),
      })
    );
  });

  it("returns null only for an unauthenticated session", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 401 }));
    await expect(authApi.me()).resolves.toBeNull();

    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 503 }));
    await expect(authApi.me()).rejects.toThrow("temporairement indisponible");
  });

  it("logs out through the backend with credentials", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(authApi.logout()).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("logs in through the backend with credentials", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(user), { status: 200 }));
    await expect(authApi.login({ email: "alex@example.com", password: "secret123" })).resolves.toEqual(user);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/login",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("reports a missing or invalid API URL instead of using a mock session", () => {
    expect(() => resolveApiBaseUrl(undefined)).toThrow("n’est pas configurée");
    expect(() => resolveApiBaseUrl("javascript:alert(1)")).toThrow("URL HTTP ou HTTPS valide");
  });

  it("reports rate limiting and network failures clearly", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 429 }));
    await expect(authApi.login({ email: "alex@example.com", password: "secret123" }))
      .rejects.toThrow("Trop de tentatives");

    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(authApi.login({ email: "alex@example.com", password: "secret123" }))
      .rejects.toThrow("Impossible de joindre l’API FeedMe");
  });

  it("uses typed errors for non-success responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 409 }));
    await expect(authApi.register({
      name: "Alex",
      email: "alex@example.com",
      campus: "Campus Arch",
      password: "secret123",
    })).rejects.toEqual(expect.objectContaining<AuthApiError>({
      name: "AuthApiError",
      status: 409,
      message: "Un compte existe déjà avec cet email",
    }));
  });
});
