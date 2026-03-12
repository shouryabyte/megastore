import http from "http";
import { Server as IOServer } from "socket.io";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env, frontendOrigins } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { initSockets } from "./sockets/initSockets.js";
import { setIo } from "./sockets/socketHub.js";
import { seedCategoriesIfEmpty } from "./config/seedCategories.js";
import { seedAdminIfEnv } from "./config/seedAdmin.js";

async function main() {
  await connectDb();
  await seedCategoriesIfEmpty();
  await seedAdminIfEnv();

  const app = createApp();
  const server = http.createServer(app);

  const io = new IOServer(server, {
    cors: {
      origin: frontendOrigins,
      credentials: true
    }
  });
  setIo(io);
  initSockets(io);

  server.listen(Number(env.PORT), () => {
    logger.info({ msg: `Server listening on port ${env.PORT}` });
  });

  const shutdown = () => {
    logger.info({ msg: "Shutting down..." });
    server.close(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
