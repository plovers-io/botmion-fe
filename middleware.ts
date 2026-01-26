import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware runs on EVERY REQUEST before it reaches your application
 *
 * Flow:
 * User Request → Middleware (checks, logs, adds headers) → Your App Route → Response
 *
 * The middleware.ts file automatically executes because:
 * 1. Next.js recognizes it as a special file in the root directory
 * 2. Runs at the EDGE (server-side, very fast)
 * 3. config.matcher defines which routes to intercept
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // 1. Create response with security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 2. CORS headers for API
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE",
    );
    response.headers.set("X-API-Version", "v1");
  }

  // 3. Request logging with timing
  const processingTime = Date.now() - startTime;
  console.log(
    `[${new Date().toISOString()}] ${request.method.padEnd(6)} ${pathname.padEnd(40)} | ${processingTime}ms`,
  );

  // 4. Add custom headers to track requests
  response.headers.set("X-Request-ID", crypto.randomUUID());
  response.headers.set("X-Response-Time", `${processingTime}ms`);

  // 5. Add cache control headers based on path
  if (pathname.startsWith("/api/")) {
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate",
    );
  } else if (pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  } else {
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=3600",
    );
  }

  return response;
}

// config.matcher - এটি বলে দেয় কোন routes এ middleware run করতে হবে
export const config = {
  // Match all routes except static files and images
  // Example matches: /, /login, /protected/home, /api/users
  // Example skips: /_next/static/*, /favicon.ico, /public/*
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
