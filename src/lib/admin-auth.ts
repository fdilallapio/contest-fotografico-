import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

export interface AdminSessionData {
  isAdmin?: boolean;
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters");
}

export const sessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: "contest_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8h
  },
};

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  return getIronSession<AdminSessionData>(await cookies(), sessionOptions);
}

/** Throws-free guard for API routes: returns true if the caller is an authenticated admin. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session.isAdmin === true;
}
