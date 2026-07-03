import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach } from "vitest";

export function useTestDatabase() {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
}
