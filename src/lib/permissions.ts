export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'REGIONAL_ADMIN' 
  | 'SECTOR_ADMIN' 
  | 'FINANCIAL_ADMIN' 
  | 'FIELD_ADMIN' 
  | 'SPECIALIZED_ADMIN' 
  | 'MERCHANT' 
  | 'CITIZEN';

interface RolePermissions {
  level: number;
  maxPermissions: number;
}

export const ROLE_HIERARCHY: Record<UserRole, RolePermissions> = {
  SUPER_ADMIN: { level: 100, maxPermissions: 300 },
  REGIONAL_ADMIN: { level: 80, maxPermissions: 50 },
  SECTOR_ADMIN: { level: 70, maxPermissions: 40 },
  FINANCIAL_ADMIN: { level: 60, maxPermissions: 30 },
  FIELD_ADMIN: { level: 50, maxPermissions: 20 },
  SPECIALIZED_ADMIN: { level: 45, maxPermissions: 25 },
  MERCHANT: { level: 30, maxPermissions: 25 },
  CITIZEN: { level: 10, maxPermissions: 10 },
};

export function hasPermission(userRole: UserRole, requiredLevel: number): boolean {
  return ROLE_HIERARCHY[userRole]?.level >= requiredLevel;
}
