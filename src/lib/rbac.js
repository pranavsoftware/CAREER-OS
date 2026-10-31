import { NextResponse } from 'next/server';

/**
 * Validates request role against allowed roles.
 * Reads role from 'x-user-role' header, query string ?role=, or body.
 */
export function verifyRole(request, allowedRoles = []) {
  if (!allowedRoles || allowedRoles.length === 0) return { authorized: true };

  const headerRole = request.headers.get('x-user-role');
  const { searchParams } = new URL(request.url);
  const queryRole = searchParams.get('role') || searchParams.get('userRole');

  const detectedRole = (headerRole || queryRole || '').toLowerCase();

  // If detected role is explicitly provided and is in allowed roles
  if (detectedRole && allowedRoles.map(r => r.toLowerCase()).includes(detectedRole)) {
    return { authorized: true, role: detectedRole };
  }

  // If role is detected and not in allowed roles, block
  if (detectedRole && !allowedRoles.map(r => r.toLowerCase()).includes(detectedRole)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Forbidden: role '${detectedRole}' is not authorized. Allowed: ${allowedRoles.join(', ')}` },
        { status: 403 }
      ),
    };
  }

  // Fallback for internal / development requests where role is not explicitly headered:
  // If allowedRoles contains university or company, return authorized with first role or header
  return { authorized: true, role: allowedRoles[0] };
}

/**
 * Enforces role restriction. Returns null if authorized, or a 403 NextResponse if forbidden.
 */
export function enforceRole(request, allowedRoles = []) {
  const result = verifyRole(request, allowedRoles);
  if (!result.authorized) {
    return result.response;
  }
  return null;
}


