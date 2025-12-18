import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { clientEnv } from "@/lib/env.client";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/jobs";

    if (code) {
        const response = NextResponse.redirect(`${origin}${next}`);

        const supabase = createServerClient(
            clientEnv.NEXT_PUBLIC_SUPABASE_URL,
            clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return request.headers.get("cookie")?.split("; ").map((c) => {
                            const [name, ...v] = c.split("=");
                            return { name, value: v.join("=") };
                        }) ?? [];
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return response;
        }
    }

    // Return to login with error if code exchange failed
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
