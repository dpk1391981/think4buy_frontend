/**
 * Response Field Sanitization — BFF Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Strips sensitive/internal fields from backend responses before they
 * reach the browser. This runs ONLY in Next.js server-side code (Route
 * Handlers, server components, getServerSideProps).
 *
 * Philosophy:
 *   - Allowlist (not blocklist): only known-safe fields pass through
 *   - Role-aware: agents get more fields than anonymous visitors
 *   - Never expose: internal IDs in joins, pricing logic params,
 *     owner contact details to non-authenticated users
 */

// ─── Property ────────────────────────────────────────────────────────────────

/** Fields safe to return to any anonymous visitor */
const PROPERTY_PUBLIC_FIELDS = new Set([
  'id', 'slug', 'title', 'description', 'price', 'priceNegotiable',
  'propertyType', 'listingType', 'status', 'bedrooms', 'bathrooms',
  'area', 'areaUnit', 'floor', 'totalFloors', 'furnished', 'facing',
  'parking', 'amenities', 'images', 'mainImage', 'locality', 'city',
  'state', 'country', 'latitude', 'longitude', 'postedAt', 'updatedAt',
  'viewCount', 'isFeatured', 'isBoosted', 'agentName', 'agentAvatar',
  'agentSlug', 'agentId', 'projectName', 'reraNumber',
]);

/** Additional fields visible to authenticated users (buyers) */
const PROPERTY_AUTH_FIELDS = new Set([
  ...PROPERTY_PUBLIC_FIELDS,
  'ownerPhone',   // masked: +91 98765 XXXXX
  'ownerEmail',   // masked: a***@gmail.com
  'exactAddress',
]);

/** Full fields for agents/owners/admin */
const PROPERTY_AGENT_FIELDS = new Set([
  ...PROPERTY_AUTH_FIELDS,
  'ownerName', 'internalNotes', 'leadCount', 'inquiryCount',
  'subscriptionPlan', 'boostExpiry', 'approvalStatus', 'rejectionReason',
]);

export type UserRole = 'anonymous' | 'buyer' | 'agent' | 'owner' | 'admin';

function getAllowedFields(role: UserRole): Set<string> {
  if (role === 'admin') return PROPERTY_AGENT_FIELDS; // admins see everything
  if (role === 'agent' || role === 'owner') return PROPERTY_AGENT_FIELDS;
  if (role === 'buyer') return PROPERTY_AUTH_FIELDS;
  return PROPERTY_PUBLIC_FIELDS;
}

/** Mask a phone number: +91 98765 XXXXX */
function maskPhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return undefined;
  return phone.slice(0, -4) + 'XXXX';
}

/** Mask an email: a***@gmail.com */
function maskEmail(email: string | undefined): string | undefined {
  if (!email || !email.includes('@')) return undefined;
  const [user, domain] = email.split('@');
  return `${user[0]}${'*'.repeat(Math.min(user.length - 1, 4))}@${domain}`;
}

/** Sanitize a single property object */
export function sanitizeProperty(raw: Record<string, any>, role: UserRole = 'anonymous'): Record<string, any> {
  const allowed = getAllowedFields(role);
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!allowed.has(key)) continue;

    // Apply masking for semi-public contact fields
    if (key === 'ownerPhone' && role === 'buyer') {
      result[key] = maskPhone(value);
    } else if (key === 'ownerEmail' && role === 'buyer') {
      result[key] = maskEmail(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/** Sanitize an array of properties */
export function sanitizeProperties(
  raws: Record<string, any>[],
  role: UserRole = 'anonymous',
): Record<string, any>[] {
  return raws.map((p) => sanitizeProperty(p, role));
}

// ─── Agent ───────────────────────────────────────────────────────────────────

const AGENT_PUBLIC_FIELDS = new Set([
  'id', 'slug', 'name', 'avatar', 'agency', 'agencyName', 'city',
  'localities', 'languages', 'experience', 'totalListings', 'rating',
  'reviewCount', 'isVerified', 'isPremium', 'specializations',
  'about', 'reraId', 'joinedAt',
]);

const AGENT_AUTH_FIELDS = new Set([
  ...AGENT_PUBLIC_FIELDS,
  'phone',  // masked
  'email',  // masked
]);

export function sanitizeAgent(raw: Record<string, any>, role: UserRole = 'anonymous'): Record<string, any> {
  const allowed = role === 'anonymous' ? AGENT_PUBLIC_FIELDS : AGENT_AUTH_FIELDS;
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!allowed.has(key)) continue;
    if (key === 'phone' && role === 'buyer') result[key] = maskPhone(value);
    else if (key === 'email' && role === 'buyer') result[key] = maskEmail(value);
    else result[key] = value;
  }

  return result;
}

export function sanitizeAgents(raws: Record<string, any>[], role: UserRole = 'anonymous') {
  return raws.map((a) => sanitizeAgent(a, role));
}

// ─── Generic stripper ────────────────────────────────────────────────────────

/** Strip any field that starts with these prefixes (internal DB artifacts) */
const ALWAYS_STRIP_PREFIXES = ['__', '_cache', 'raw', 'internal'];
const ALWAYS_STRIP_KEYS = new Set([
  'password', 'passwordHash', 'refreshToken', 'otpSecret', 'otpExpiry',
  'stripeCustomerId', 'razorpayContactId', 'razorpayFundAccountId',
  'commissionRate', 'pricingFormula', 'costBasis', 'internalScore',
  'fraudFlag', 'deletedAt', 'createdBy', 'updatedBy',
]);

/** Strip obviously sensitive fields from any arbitrary object (defensive fallback) */
export function stripSensitiveFields(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripSensitiveFields);
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (ALWAYS_STRIP_KEYS.has(key)) continue;
      if (ALWAYS_STRIP_PREFIXES.some((p) => key.startsWith(p))) continue;
      result[key] = stripSensitiveFields(val);
    }
    return result;
  }
  return obj;
}
