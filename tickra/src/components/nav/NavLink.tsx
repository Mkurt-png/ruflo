'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Tiny client-side wrapper around next/link that reads the active
// pathname and stamps aria-current='page' on the matching item.
// Used by Navbar / MobileMenu so screen-reader users can hear which
// nav item points at the page they are on.

export function NavLink({
  href,
  className,
  onClick,
  role,
  children,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  /** Optional ARIA role passthrough (e.g. 'menuitem' inside an
   * ExploreMenu role='menu'). */
  role?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  // Treat an exact match as "this is the current page". Avoid
  // marking the locale root (e.g. /fr) as current on every subpage.
  const isCurrent = pathname === href;
  return (
    <Link
      href={href}
      className={className}
      onClick={onClick}
      role={role}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
