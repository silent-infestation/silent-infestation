import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  console.info("POST /api/auth/logout");

  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (token) {
    cookieStore.set("token", "", { maxAge: 0, path: "/", httpOnly: true });
    return NextResponse.json({ message: "Déconnexion réussie" });
  } else {
    return NextResponse.json({ message: "No token found" }, { status: 400 });
  }
}
