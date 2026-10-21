'use client';
import { useState, useEffect } from 'react';
import { can, filterNavByRole, ROLE_INFO } from './permissions';

export function usePermissions() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
      setSession(stored);
    } catch { }
    setReady(true);
  }, []);

  const role = session?.is_employee ? (session.role || 'employee') : 'owner';
  const roleInfo = ROLE_INFO[role] || ROLE_INFO.employee;
  const isOwner = !session?.is_employee;
  const isEmployee = session?.is_employee === true;

  return {
    session,
    ready,
    role,
    roleInfo,
    isOwner,
    isEmployee,
    can: (permission) => can(role, permission),
    nav: session ? filterNavByRole(role) : [],
  };
}
