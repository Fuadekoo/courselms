// import { execSync } from "child_process";
import { readFileSync } from "fs";
import https from "https";
import express from "express";
import cors from "cors";
import next from "next";
// import { startBot } from "./bot";

process.loadEnvFile(".env");

const dev = process.env.NODE_ENV !== "production",
  hostname = "https://e-learning.darelkubra.com",
   //hostname = "localhost",
  port = 3000,
  nextApp = next({ dev, hostname, port }),
  handle = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
  // Express App
  const expressApp = express();
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: true }));
  expressApp.use(
    cors({
      origin: "*",
      methods: "GET,POST,PUT,DELETE",
      allowedHeaders: "Content-Type,Authorization",
    })
  );

  // ...

  expressApp.all("*", (req, res) => handle(req, res));

  // expressApp.listen(port, async () => {
  //   await startBot();
  //   console.log(`> Ready on http://${hostname}:${port}`);
  // });

  // Http Server
  const httpServer = https.createServer(
    {
      key: readFileSync("./keys/example.key"),
      cert: readFileSync("./keys/example.crt"),
    },
    expressApp
  );
  httpServer.listen({ host: hostname, port }, async () => {
    // Start Bot
    // await startBot();
    console.log(`> Ready on https://${hostname}:${port}`);
  });
});
