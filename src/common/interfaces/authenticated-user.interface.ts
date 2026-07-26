export interface AuthenticatedPermissionGroup {
  id: string;
  name: string;
  description: string | null;
}

export interface AuthenticatedPermission {
  id: string;
  name: string;
  description: string | null;
  group: AuthenticatedPermissionGroup;
}

export interface AuthenticatedRole {
  id: string;
  name: string;
  description: string | null;
  permissions: AuthenticatedPermission[];
}

export interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  role: AuthenticatedRole;
  permissions: string[];
}
