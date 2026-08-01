import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export interface AuthResponse {
  accessToken: string;
  csrfToken: string;
  user: AuthenticatedUser;
}
