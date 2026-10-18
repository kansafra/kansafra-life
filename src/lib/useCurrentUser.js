'use client';
import { useEffect, useState } from 'react';
import { getSession } from './auth';

const PERMISSIONS_BY_ROLE = {
  manager: ['products', 'orders', 'inventory', 'reports', 'finance', 'customers'],
  sales: ['products', 'orders', 'customers'],
  inventory: ['products', 'inventory'],
  accountant: ['reports', 'finance'],
  delivery: ['orders'],
  support: ['customers', 'orders'],
};

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getSession());
    setLoading(false);
    const onChange = () => setUser(getSession());
    window.addEventListener('sanad-auth-change', onChange);
    return () => window.removeEventListener('sanad-auth-change', onChange);
  }, []);

  const isEmployee = user?.type === 'employee';
  const isSectionAdmin = user?.is_section_admin === true;
  const isOwner = !!user && !isEmployee && !isSectionAdmin;

  function hasPermission(key) {
    if (!user) return false;
    if (isOwner || isSectionAdmin) return true;
    if (isEmployee) {
      const perms = user.permissions || [];
      if (perms.includes(key)) return true;
      const rolePerms = PERMISSIONS_BY_ROLE[user.role] || [];
      return rolePerms.includes(key);
    }
    return false;
  }

  const dataOwnerName = isEmployee ? user.entity_name : user?.display_name;
  const sectionType = isEmployee ? user.entity_type : user?.entity_type;

  return { user, loading, isOwner, isEmployee, isSectionAdmin, hasPermission, dataOwnerName, sectionType };
}
