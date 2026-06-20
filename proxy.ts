import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes requiring a specific role
const ROLE_PREFIXES: Record<string, string> = {
  "/admin": "admin",
  "/professor": "professor",
  "/student": "student",
};

// Routes requiring any authenticated user with a profile
const AUTH_PREFIXES = ["/settings"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const loginRedirect = (reason?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnTo", pathname);
    if (reason) url.searchParams.set("error", reason);
    return NextResponse.redirect(url);
  };

  const protectedPrefix = Object.keys(ROLE_PREFIXES).find((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (protectedPrefix || isAuthOnly) {
    // Must be authenticated
    if (!data.user) return loginRedirect();

    // Must have a profile in our database
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      // Authenticated in Supabase but no profile — sign them out
      await supabase.auth.signOut();
      return loginRedirect("Your account is not set up. Contact an administrator.");
    }

    // For role-specific routes: check role (admins can access everything)
    if (protectedPrefix) {
      const requiredRole = ROLE_PREFIXES[protectedPrefix];
      if (profile.role !== requiredRole && profile.role !== "admin") {
        return loginRedirect("You do not have permission to access that page.");
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
