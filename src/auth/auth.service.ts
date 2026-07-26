import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponse, TokenBundle } from './auth.types';
import { LoginDto } from './dto/login.dto';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
const INVALID_TOKEN_MESSAGE = 'Refresh token is invalid or expired';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse & TokenBundle> {
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const tokenBundle = await this.issueTokens(user.id);

    return {
      ...tokenBundle,
      user: this.mapUser(user),
    };
  }

  async session(userId: string): Promise<AuthenticatedUser> {
    const user = await this.findUserWithAccessData(userId);

    if (!user || !user.active) {
      throw new UnauthorizedException('Token is invalid or the account is inactive');
    }

    return this.mapUser(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse & TokenBundle> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.findUserWithAccessData(payload.sub);

    if (!user || !user.active || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const tokenMatches = await compare(refreshToken, user.refreshTokenHash);

    if (!tokenMatches || user.refreshTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const tokenBundle = await this.issueTokens(user.id);

    return {
      ...tokenBundle,
      user: this.mapUser(user),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        refreshTokenHash: true,
      },
    });

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    const tokenMatches = await compare(refreshToken, user.refreshTokenHash);

    if (!tokenMatches) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  }

  async issueTokens(userId: string): Promise<TokenBundle> {
    const accessToken = await this.jwtService.signAsync({ sub: userId });
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, tokenUse: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret',
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d',
      },
    );
    const csrfToken = randomBytes(32).toString('hex');

    await this.persistRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken, csrfToken };
  }

  async persistRefreshToken(userId: string, refreshToken: string) {
    const expiresAt = new Date(Date.now() + this.parseDurationToMilliseconds());
    const refreshTokenHash = await hash(refreshToken, 12);

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash,
        refreshTokenExpiresAt: expiresAt,
      },
    });

    return expiresAt;
  }

  private async verifyRefreshToken(refreshToken: string): Promise<{ sub: string }> {
    try {
      return await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }
  }

  private async findUserWithAccessData(userId: string) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private mapUser(user: any): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      active: user.active,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        permissions: user.role.permissions.map(({ permission }: any) => ({
          id: permission.id,
          name: permission.name,
          description: permission.description,
          group: {
            id: permission.group.id,
            name: permission.group.name,
            description: permission.group.description,
          },
        })),
      },
      permissions: user.role.permissions.map(({ permission }: any) => permission.name),
    };
  }

  private parseDurationToMilliseconds() {
    const ttl = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d';
    const match = /^([0-9]+)([smhd])$/.exec(ttl);

    if (!match) {
      return 30 * 24 * 60 * 60 * 1000;
    }

    const value = Number.parseInt(match[1], 10);
    const unit = match[2];

    if (unit === 's') {
      return value * 1000;
    }

    if (unit === 'm') {
      return value * 60 * 1000;
    }

    if (unit === 'h') {
      return value * 60 * 60 * 1000;
    }

    return value * 24 * 60 * 60 * 1000;
  }
}
