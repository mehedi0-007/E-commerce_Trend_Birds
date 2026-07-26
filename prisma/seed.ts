import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

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
    group: "Permissions",
    description: "Permission management module",
    permissions: [
      { name: "permission:read", description: "View permissions" },
      { name: "permission:create", description: "Create permission groups" },
      { name: "permission:update", description: "Update permission groups" },
      { name: "permission:delete", description: "Delete permissions" },
    ],
  },
  {
    group: "Roles",
    description: "Role management module",
    permissions: [
      { name: "role:read", description: "View roles" },
      { name: "role:create", description: "Create roles" },
      { name: "role:update", description: "Update roles" },
      { name: "role:delete", description: "Delete roles" },
    ],
  },
  {
    group: "Users",
    description: "User management module",
    permissions: [
      { name: "user:read", description: "View users" },
      { name: "user:create", description: "Create user accounts" },
      { name: "user:update", description: "Update user accounts" },
      { name: "user:delete", description: "Delete user accounts" },
    ],
  },
  {
    group: "Media",
    description: "Media management module",
    permissions: [
      { name: "media:read", description: "View media files" },
      { name: "media:create", description: "Upload media files" },
      { name: "media:update", description: "Update media metadata" },
      { name: "media:delete", description: "Delete media files" },
    ],
  },
  {
    group: "Category",
    description: "Category management module",
    permissions: [
      { name: "category:read", description: "View categories" },
      { name: "category:create", description: "Create categories" },
      { name: "category:update", description: "Update categories" },
      { name: "category:delete", description: "Delete categories" },
    ],
  },
  {
    group: "Brand",
    description: "Brand management module",
    permissions: [
      { name: "brand:read", description: "View brands" },
      { name: "brand:create", description: "Create brands" },
      { name: "brand:update", description: "Update brands" },
      { name: "brand:delete", description: "Delete brands" },
    ],
  },
  {
    group: "Attribute",
    description: "Attribute management module",
    permissions: [
      { name: "attribute:read", description: "View product attributes" },
      { name: "attribute:create", description: "Create product attributes" },
      { name: "attribute:update", description: "Update product attributes" },
      { name: "attribute:delete", description: "Delete product attributes" },
    ],
  },
  {
    group: "Product",
    description: "Product management module",
    permissions: [
      { name: "product:read", description: "View products" },
      { name: "product:create", description: "Create products" },
      { name: "product:update", description: "Update products" },
      { name: "product:delete", description: "Delete products" },
    ],
  },
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
      const permissionRecord = await prisma.permission.upsert({
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

      allCreatedPermissions.push({
        id: permissionRecord.id,
        name: permissionRecord.name,
      });
    }
  }

  const adminRole = await prisma.role.upsert({
    where: { name: "Super Administrator" },
    update: {
      description: "Unrestricted system access",
      active: true,
    },
    create: {
      name: "Super Administrator",
      description: "Unrestricted system access",
      active: true,
    },
  });

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

  const limitedRole = await prisma.role.upsert({
    where: { name: "Catalog Reviewer" },
    update: {
      description: "Read-only access to products and categories",
      active: true,
    },
    create: {
      name: "Catalog Reviewer",
      description: "Read-only access to products and categories",
      active: true,
    },
  });

  const catalogPermissions = allCreatedPermissions.filter(
    (p) =>
      p.name === "dashboard:watch" ||
      p.name === "category:read" ||
      p.name === "product:read",
  );

  for (const perm of catalogPermissions) {
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

  const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
  const limitedPasswordHash = await bcrypt.hash("Catalog123!", 12);

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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
