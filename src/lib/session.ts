import { jwtVerify, SignJWT } from "jose";

// Dipakai juga di middleware (edge runtime) — jangan import Prisma di sini
export const SESSION_COOKIE = "ib_logged_in";

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET belum di-set");
  return new TextEncoder().encode(s);
};

export async function signSession(payload: { uid: number; pv: string }, maxAgeSeconds: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secret());
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: Number(payload.uid), pv: String(payload.pv) };
  } catch {
    return null;
  }
}
