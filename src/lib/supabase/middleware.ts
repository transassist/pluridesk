import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clientEnv } from "@/lib/env.client";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/auth/login", "/auth/callback", "/auth/signup"];

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        clientEnv.NEXT_PUBLIC_SUPABASE_URL,
        clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    // Check if the route is public
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

    // If user is not authenticated and trying to access a protected route
    if (!user && !isPublicRoute) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If user is authenticated and trying to access login page, redirect to jobs
    if (user && pathname.startsWith("/auth/login")) {
        return NextResponse.redirect(new URL("/jobs", request.url));
    }

    return response;
}
