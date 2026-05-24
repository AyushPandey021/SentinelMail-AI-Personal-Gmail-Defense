import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectMongo } from "./db/mongo.js";
import { startGmailPoller } from "./modules/gmail/gmailClient.js";

await connectMongo();
startGmailPoller();

createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT, url: `http://localhost:${env.PORT}` }, "Backend server running");
  console.log(`Backend server running at http://localhost:${env.PORT}`);
});
