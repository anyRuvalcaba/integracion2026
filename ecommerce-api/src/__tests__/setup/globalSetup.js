import { MongoMemoryServer } from "mongodb-memory-server";

let mongod;

export async function setup() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = "test-jwt-secret-vitest";
  process.env.JWT_REFRESH_TOKEN = "test-refresh-secret-vitest";
}

export async function teardown() {
  if (mongod) {
    await mongod.stop();
  }
}
