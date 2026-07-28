import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";

export function mapUserToAuthenticatedUser(user: any): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.active,
    role: {
      id: user.role.id,
      name: user.role.name,
      description: user.role.description,
    },
    permissions: user.role.permissions.map(
      ({ permission }: any) => permission.name,
    ),
  };
}
