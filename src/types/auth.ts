
export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  message: string;
}

export interface AuthError {
  error: string;
}

export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}
