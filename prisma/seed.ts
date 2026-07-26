import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const dashboardGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Dashboard' },
    update: {},
    create: {
      name: 'Dashboard',
      description: 'Dashboard shell access',
    },
  });

  const dashboardWatch = await prisma.permission.upsert({
    where: { name: 'dashboard:watch' },
    update: {},
    create: {
      name: 'dashboard:watch',
      description: 'View the dashboard shell',
      groupId: dashboardGroup.id,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'Super Administrator' },
    update: {},
    create: {
      name: 'Super Administrator',
      description: 'Initial administrative role',
    },
  });

  const limitedRole = await prisma.role.upsert({
    where: { name: 'Catalog Access Only' },
    update: {},
    create: {
      name: 'Catalog Access Only',
      description: 'Restricted reviewer account',
    },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: dashboardWatch.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: dashboardWatch.id,
    },
  });

  const adminPasswordHash = await hash('Admin123!', 12);
  const limitedPasswordHash = await hash('Catalog123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      active: true,
    },
    create: {
      name: 'System Administrator',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'catalog@example.com' },
    update: {
      passwordHash: limitedPasswordHash,
      roleId: limitedRole.id,
      active: true,
    },
    create: {
      name: 'Catalog Reviewer',
      email: 'catalog@example.com',
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
