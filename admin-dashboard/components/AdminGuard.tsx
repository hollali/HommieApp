'use client';

export function AdminGuard({
  children,
  allowedRoles = ['admin', 'super_admin'],
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  void allowedRoles;
  return <>{children}</>;
}

