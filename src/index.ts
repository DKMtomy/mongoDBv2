import {
  HttpRequest,
  HttpHeader,
  HttpRequestMethod,
  http,
} from "@minecraft/server-net";
import { system, world } from "@minecraft/server";
import { MongoDB } from "./mongodb";
import { MinecraftServer } from "discord";

interface KingdomMember {
  name: string;
  role: string;
}

interface Kingdom {
  name: string;
  members: KingdomMember[];
}

const db = new MongoDB({
  baseURL:
    "https://eu-central-1.aws.data.mongodb-api.com/app/data-asalozh/endpoint/data/v1",
  apiKey: "",
  dataSource: "Kingdom",
  // Removed database and collection from initialization
});

system.afterEvents.scriptEventReceive.subscribe(async (event) => {
  console.log(`Received event: ${event.id}`);
  if (!event.id.startsWith("Kingdom:")) return;

  try {
    const action = event.id.replace("Kingdom:", "");
    const data = JSON.parse(event.message);

    // Extract database and collection from the received data
    const { database, collection, ...actionData } = data;

    // Mapping actions to database methods
    const dbActions: {
      [key: string]: (
        database: string,
        collection: string,
        any
      ) => Promise<any>;
    } = {
      insertOne: (database, collection, data) =>
        db.insertOne(database, collection, data),
      findOne: (database, collection, data) =>
        db.findOne(database, collection, data),
      find: (database, collection, data) => db.find(database, collection, data),
      updateOne: (database, collection, data) =>
        db.updateOne(database, collection, data.filter, data.update),
      updateMany: (database, collection, data) =>
        db.updateMany(database, collection, data.filter, data.update),
      deleteOne: (database, collection, data) =>
        db.deleteOne(database, collection, data),
      deleteMany: (database, collection, data) =>
        db.deleteMany(database, collection, data),
    };

    if (dbActions[action]) {
      const result = await dbActions[action](database, collection, actionData);
      console.log(`${action} executed successfully:`);
      world
        .getDimension("overworld")
        .runCommandAsync(
          `scriptevent server:${action} ${JSON.stringify(result)}`
        );
    } else {
      console.warn(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error(`Error processing event: ${event.id}`, error);
  }
});

// Create an instance and start polling the server
// const minecraftServer = new MinecraftServer();
// minecraftServer.pollServer();