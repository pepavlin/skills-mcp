import path from "path";
import fs from "fs";

// Use a separate test database
const testDbPath = path.join(process.cwd(), "tmp", "test-skills.db");
process.env.DATABASE_PATH = testDbPath;

// Ensure tmp directory exists
const tmpDir = path.dirname(testDbPath);
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Clean up test DB before each test run
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}
// Also clean WAL files
if (fs.existsSync(testDbPath + "-wal")) {
  fs.unlinkSync(testDbPath + "-wal");
}
if (fs.existsSync(testDbPath + "-shm")) {
  fs.unlinkSync(testDbPath + "-shm");
}
