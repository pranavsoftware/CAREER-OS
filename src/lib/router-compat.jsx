'use client';

import React, { useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter, useParams as useNextParams, usePathname, useSearchParams } from 'next/navigation';

export function Link({ to, href, children, className, style, ...props }) {
  const target = to || href || '#';
  const resolvedStyle = typeof style === 'function' ? style({ isActive: false }) : style;
  return (
    <NextLink href={target} className={className} style={resolvedStyle} {...props}>
      {children}
    </NextLink>
  );
}

export function NavLink({ to, href, className, style, children, end, ...props }) {
  const pathname = usePathname();
  const target = to || href || '#';
  const isActive = end ? pathname === target : (pathname === target || (target !== '/' && pathname?.startsWith(target)));
  
  const resolvedClass = typeof className === 'function' 
    ? className({ isActive }) 
    : `${className || ''} ${isActive ? 'active bg-primary-50 text-primary-700 font-semibold dark:bg-primary-950 dark:text-primary-300' : ''}`;

  const resolvedStyle = typeof style === 'function'
    ? style({ isActive })
    : style;

  return (
    <NextLink href={target} className={resolvedClass} style={resolvedStyle} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to, options) => {
    if (typeof to === 'number') {
      if (to === -1) router.back();
    } else if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

export function useParams() {
  const params = useNextParams();
  return params || {};
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return {
    pathname: pathname || '',
    search: searchParams ? `?${searchParams.toString()}` : '',
  };
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  useEffect(() => {
    if (to) {
      if (replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    }
  }, [router, to, replace]);

  return null;
}

export default {
  Link,
  NavLink,
  useNavigate,
  useParams,
  useLocation,
  Navigate,
};
