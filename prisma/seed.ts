import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const MODULE_PERMISSIONS = [
  {
    group: "Dashboard",
    description: "Dashboard shell access",
    permissions: [
      { name: "dashboard:watch", description: "View the dashboard shell" },
    ],
  },
  {
    group: "Permission",
    description: "Permission management module",
    permissions: [
      { name: "permission:watch", description: "View permission management screen" },
      { name: "permission:create", description: "Create permission groups" },
      { name: "permission:read", description: "Read permission groups and items" },
      { name: "permission:update", description: "Update permission groups" },
      { name: "permission:delete", description: "Delete permissions" },
    ],
  },
  {
    group: "Role",
    description: "Role management module",
    permissions: [
      { name: "role:watch", description: "View role management screen" },
      { name: "role:create", description: "Create roles" },
      { name: "role:read", description: "Read roles" },
      { name: "role:update", description: "Update roles and permissions" },
      { name: "role:delete", description: "Delete roles" },
    ],
  },
  {
    group: "User",
    description: "User management module",
    permissions: [
      { name: "user:watch", description: "View user management screen" },
      { name: "user:create", description: "Create user accounts" },
      { name: "user:read", description: "Read user accounts" },
      { name: "user:update", description: "Update user accounts" },
      { name: "user:delete", description: "Delete user accounts" },
    ],
  },
  {
    group: "Media",
    description: "Media library module",
    permissions: [
      { name: "media:watch", description: "View media library screen" },
      { name: "media:read", description: "Read media assets" },
      { name: "media:upload", description: "Upload media assets" },
      { name: "media:write", description: "Update media metadata" },
      { name: "media:delete", description: "Delete media assets" },
    ],
  },
  {
    group: "Category",
    description: "Category taxonomy module",
    permissions: [
      { name: "category:watch", description: "View category management screen" },
      { name: "category:create", description: "Create categories" },
      { name: "category:read", description: "Read categories" },
      { name: "category:update", description: "Update categories" },
      { name: "category:delete", description: "Delete categories" },
    ],
  },
  {
    group: "Brand",
    description: "Brand management module",
    permissions: [
      { name: "brand:watch", description: "View brand management screen" },
      { name: "brand:create", description: "Create brands" },
      { name: "brand:read", description: "Read brands" },
      { name: "brand:update", description: "Update brands" },
      { name: "brand:delete", description: "Delete brands" },
    ],
  },
  {
    group: "Attribute",
    description: "Attribute and variant values module",
    permissions: [
      { name: "attribute:watch", description: "View attribute management screen" },
      { name: "attribute:create", description: "Create attributes and values" },
      { name: "attribute:read", description: "Read attributes and values" },
      { name: "attribute:update", description: "Update attributes and values" },
      { name: "attribute:delete", description: "Delete attributes and values" },
    ],
  },
  {
    group: "Product",
    description: "Product and variant management module",
    permissions: [
      { name: "product:watch", description: "View product management screen" },
      { name: "product:create", description: "Create products and variants" },
      { name: "product:read", description: "Read products and variants" },
      { name: "product:update", description: "Update products and variants" },
      { name: "product:delete", description: "Delete products and variants" },
    ],
  },
];

const CATALOG_PERMISSIONS = [
  "dashboard:watch",
  "media:watch",
  "media:read",
  "category:watch",
  "category:read",
  "brand:watch",
  "brand:read",
  "attribute:watch",
  "attribute:read",
  "product:watch",
  "product:read",
];

async function main() {
  const allCreatedPermissions: { id: string; name: string }[] = [];

  for (const item of MODULE_PERMISSIONS) {
    const group = await prisma.permissionGroup.upsert({
      where: { name: item.group },
      update: { description: item.description },
      create: {
        name: item.group,
        description: item.description,
      },
    });

    for (const perm of item.permissions) {
      const permission = await prisma.permission.upsert({
        where: { name: perm.name },
        update: {
          description: perm.description,
          groupId: group.id,
        },
        create: {
          name: perm.name,
          description: perm.description,
          groupId: group.id,
        },
      });
      allCreatedPermissions.push(permission);
    }
  }

  const adminRole = await prisma.role.upsert({
    where: { name: "Super Administrator" },
    update: { description: "Full administrative access to all modules" },
    create: {
      name: "Super Administrator",
      description: "Full administrative access to all modules",
      active: true,
    },
  });

  const limitedRole = await prisma.role.upsert({
    where: { name: "Catalog Access Only" },
    update: { description: "Restricted catalog view permissions" },
    create: {
      name: "Catalog Access Only",
      description: "Restricted catalog view permissions",
      active: true,
    },
  });

  // Grant all permissions to Super Administrator
  for (const perm of allCreatedPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Grant catalog permissions to Catalog Access Only role
  const catalogPerms = allCreatedPermissions.filter((p) =>
    CATALOG_PERMISSIONS.includes(p.name),
  );
  for (const perm of catalogPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: limitedRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: limitedRole.id,
        permissionId: perm.id,
      },
    });
  }

  const adminPasswordHash = await hash("Admin123!", 12);
  const limitedPasswordHash = await hash("Catalog123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      active: true,
    },
    create: {
      name: "System Administrator",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "catalog@example.com" },
    update: {
      passwordHash: limitedPasswordHash,
      roleId: limitedRole.id,
      active: true,
    },
    create: {
      name: "Catalog Reviewer",
      email: "catalog@example.com",
      passwordHash: limitedPasswordHash,
      roleId: limitedRole.id,
      active: true,
    },
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
