export interface AuthenticatedRole {
  id: string;
  name: string;
  description: string | null;
}

export interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  role: AuthenticatedRole;
  permissions: string[];
}
