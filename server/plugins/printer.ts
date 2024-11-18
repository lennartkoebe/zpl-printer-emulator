import net from "node:net";
import {
  sendSSEMessageToAll,
  clients,
  setOnConnectCallback,
  sendSSEMessageToClient,
} from "./sse";

type ZPLData = {
  timestamp: string;
  zpl: string;
};

let queue: ZPLData[] = [];

setOnConnectCallback((client) => {
  sendSSEMessageToClient(client, "print", queue);
  queue = [];
});

function sendOrQueue(zpl: string) {
  const data: ZPLData = {
    timestamp: new Date().toISOString(),
    zpl,
  };

  if (clients.size > 0) {
    sendSSEMessageToAll("print", [data]);
    return;
  }

  queue.push(data);

  queue = queue.slice(-5);
}

export default defineNitroPlugin(async (nitroApp) => {
  const PORT = 9100; // Default port

  const server = net.createServer((socket) => {
    let dataBuffer = "";

    socket.on("data", (data) => {
      dataBuffer += data.toString("utf8");
    });

    socket.on("end", () => {
      sendOrQueue(dataBuffer);
    });

    socket.on("error", (err) => {
      console.error("Socket-Error:", err.message);
    });
  });

  server.listen(PORT, () => {
    console.log(`TCP/IP-Printer-Emulator running on port ${PORT}`);
  });

  server.on("error", (err) => {
    console.error("Server-Error:", err.message);
  });
});
