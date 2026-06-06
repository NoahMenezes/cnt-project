import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const interfaces = os.networkInterfaces();
  let localIP = "localhost";

  // Scan network interfaces to find the primary non-internal IPv4 address
  for (const interfaceName of Object.keys(interfaces)) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const addr of addresses) {
        if (addr.family === "IPv4" && !addr.internal) {
          // Prioritize common Wi-Fi/Ethernet interface names (e.g. en0, wlan0, eth0)
          localIP = addr.address;
          break;
        }
      }
    }
    if (localIP !== "localhost") break;
  }

  return NextResponse.json({ ip: localIP });
}
