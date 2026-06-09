/**
 * Splits a free-text location string ("Ikeja, Lagos, Nigeria") into
 * { state, country }. The last comma-separated part is the country; everything
 * before it is the state/region. A single part is treated as country-only.
 *
 * This is the single source of truth for location parsing — registration
 * (auth.service) snapshots the parsed values onto the User, and the report
 * module parses session.location at query time with the same rule, so region
 * numbers agree everywhere.
 */
export function parseLocation(location: string | null | undefined): {
  country: string | null;
  state: string | null;
} {
  if (!location) return { country: null, state: null };

  const parts = location
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length === 0) return { country: null, state: null };
  if (parts.length === 1) return { country: parts[0], state: null };

  return {
    country: parts[parts.length - 1],
    state: parts.slice(0, parts.length - 1).join(', '),
  };
}
