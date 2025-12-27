import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the user's IP address from various headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const xRealIp = request.headers.get("x-real-ip");
    const xClientIp = request.headers.get("x-client-ip");
    const xClusterClientIp = request.headers.get("x-cluster-client-ip");
    const xForwarded = request.headers.get("x-forwarded");
    const xForwardedForOriginal = request.headers.get(
      "x-forwarded-for-original"
    );
    const xOriginalForwardedFor = request.headers.get(
      "x-original-forwarded-for"
    );
    const remoteAddr = request.headers.get("remote-addr");
    const clientIp = request.headers.get("client-ip");

    // Try to get IP from different sources (VPN-friendly)
    let ip =
      forwarded?.split(",")[0]?.trim() ||
      realIp?.trim() ||
      cfConnectingIp?.trim() ||
      xForwardedFor?.split(",")[0]?.trim() ||
      xRealIp?.trim() ||
      xClientIp?.trim() ||
      xClusterClientIp?.trim() ||
      xForwarded?.split(",")[0]?.trim() ||
      xForwardedForOriginal?.split(",")[0]?.trim() ||
      xOriginalForwardedFor?.split(",")[0]?.trim() ||
      remoteAddr?.trim() ||
      clientIp?.trim() ||
      "127.0.0.1";

    // Clean up the IP (remove port if present) WITHOUT breaking IPv6 (e.g. ::1)
    ip = ip.trim();
    const ipv4WithPortMatch = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (ipv4WithPortMatch) {
      ip = ipv4WithPortMatch[1];
    }

    // For localhost/development, use test IP for consistent testing
    const isLocal =
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip === "localhost" ||
      ip === "undefined" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.");

    if (isLocal) {
      // Use the same test IP as get-country route for consistency
      ip = "51.158.254.158";
    }

    const res = NextResponse.json({
      success: true,
      ip: ip,
      // Preserve localhost flag even when we swap to test IP
      isLocalhost: isLocal,
      headers: {
        forwarded,
        realIp,
        cfConnectingIp,
        xForwardedFor,
        xRealIp,
        xClientIp,
        xClusterClientIp,
        xForwarded,
        xForwardedForOriginal,
        xOriginalForwardedFor,
        remoteAddr,
        clientIp,
      },
    });

    // Allow short caching on the client to reduce repeated calls
    res.headers.set("Cache-Control", "public, max-age=60");
    return res;
  } catch (error) {
    console.error("IP detection error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to detect IP",
        ip: "127.0.0.1",
      },
      { status: 500 }
    );
  }
}
