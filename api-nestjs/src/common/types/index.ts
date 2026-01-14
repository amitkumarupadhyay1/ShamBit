export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  jti: string;
}
