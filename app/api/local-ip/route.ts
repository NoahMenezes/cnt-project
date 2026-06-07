import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const interfaces = os.networkInterfaces();
  let candidateIP = "";
  let prioritizedIP = "";

  // Scan network interfaces to find the primary non-internal IPv4 address
  for (const interfaceName of Object.keys(interfaces)) {
    // Ignore virtual / loopback interface names
    const isVirtual = /docker|veth|br-|virbr|vmnet/i.test(interfaceName) || /^lo\d*$/i.test(interfaceName);
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const addr of addresses) {
        if (addr.family === "IPv4" && !addr.internal) {
          // Ignore link-local address
          if (addr.address.startsWith("169.254")) {
            continue;
          }

          // Check if this interface is a primary hardware interface (Wi-Fi/Ethernet)
          const isPrioritizedInterface = /^(en|wl|eth)/i.test(interfaceName);

          if (isPrioritizedInterface && !isVirtual) {
            prioritizedIP = addr.address;
            break;
          } else if (!isVirtual) {
            candidateIP = addr.address;
          }
        }
      }
    }
    if (prioritizedIP) break;
  }

  const localIP = prioritizedIP || candidateIP || "localhost";

  return NextResponse.json({ ip: localIP });
}
