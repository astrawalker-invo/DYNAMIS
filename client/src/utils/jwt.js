export function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function jwtExpMs(token) {
  const p = decodeJwtPayload(token);
  if (!p?.exp) return null;
  return p.exp * 1000;
}
