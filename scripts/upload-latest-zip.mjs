import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "basic-ftp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, ".output");
const envPath = path.join(projectRoot, ".env.local");
const zipPattern = /^bookmark-m-(.+)-chrome\.zip$/;
const dryRun = process.argv.includes("--dry-run");

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

async function readEnvFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(trimmed.slice(separatorIndex + 1).trim());
    if (!key) continue;
    env[key] = value;
  }

  return env;
}

function parseVersion(version) {
  const [corePart, prereleasePart = ""] = version.split("-", 2);
  const core = corePart.split(".").map((segment) => Number.parseInt(segment, 10) || 0);
  const prerelease = prereleasePart
    ? prereleasePart.split(".").map((segment) => (/^\d+$/.test(segment) ? Number.parseInt(segment, 10) : segment))
    : [];

  return { core, prerelease };
}

function compareIdentifiers(left, right) {
  const leftIsNumber = typeof left === "number";
  const rightIsNumber = typeof right === "number";

  if (leftIsNumber && rightIsNumber) {
    return left - right;
  }

  if (leftIsNumber) return -1;
  if (rightIsNumber) return 1;
  return String(left).localeCompare(String(right));
}

function compareVersions(leftVersion, rightVersion) {
  const left = parseVersion(leftVersion);
  const right = parseVersion(rightVersion);
  const maxCoreLength = Math.max(left.core.length, right.core.length);

  for (let index = 0; index < maxCoreLength; index += 1) {
    const diff = (left.core[index] ?? 0) - (right.core[index] ?? 0);
    if (diff !== 0) return diff;
  }

  if (left.prerelease.length === 0 && right.prerelease.length === 0) return 0;
  if (left.prerelease.length === 0) return 1;
  if (right.prerelease.length === 0) return -1;

  const maxPrereleaseLength = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < maxPrereleaseLength; index += 1) {
    const leftIdentifier = left.prerelease[index];
    const rightIdentifier = right.prerelease[index];

    if (leftIdentifier === undefined) return -1;
    if (rightIdentifier === undefined) return 1;

    const diff = compareIdentifiers(leftIdentifier, rightIdentifier);
    if (diff !== 0) return diff;
  }

  return 0;
}

async function findLatestZip() {
  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  const zipFiles = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const match = entry.name.match(zipPattern);
    if (!match) continue;

    const fullPath = path.join(outputDir, entry.name);
    const stats = await fs.stat(fullPath);
    zipFiles.push({
      fileName: entry.name,
      fullPath,
      version: match[1],
      mtimeMs: stats.mtimeMs,
    });
  }

  if (zipFiles.length === 0) {
    throw new Error(`No zip found in ${outputDir}`);
  }

  zipFiles.sort((left, right) => {
    const versionDiff = compareVersions(right.version, left.version);
    if (versionDiff !== 0) return versionDiff;
    return right.mtimeMs - left.mtimeMs;
  });

  return zipFiles[0];
}

function requireEnv(env, key) {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing ${key} in ${envPath}`);
  }

  return value;
}

async function main() {
  const latestZip = await findLatestZip();
  console.log(`Latest zip: ${latestZip.fileName}`);

  if (dryRun) {
    console.log("Dry run enabled, skipping FTP upload.");
    return;
  }

  const env = await readEnvFile(envPath);
  const host = requireEnv(env, "FTP_HOST");
  const port = Number.parseInt(requireEnv(env, "FTP_PORT"), 10);
  const user = requireEnv(env, "FTP_USER");
  const password = requireEnv(env, "FTP_PASSWORD");
  const remoteDir = env.FTP_REMOTE_DIR || "/1";

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid FTP_PORT in ${envPath}`);
  }

  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host,
      port,
      user,
      password,
      secure: false,
    });

    await client.ensureDir(remoteDir);
    const existingFiles = await client.list();
    const oldZipFiles = existingFiles
      .map((entry) => entry.name)
      .filter((name) => zipPattern.test(name));

    for (const fileName of oldZipFiles) {
      console.log(`Removing remote file: ${fileName}`);
      await client.remove(fileName);
    }

    console.log(`Uploading ${latestZip.fileName} to ${host}:${port}${remoteDir}`);
    await client.uploadFrom(latestZip.fullPath, latestZip.fileName);
    console.log("Upload completed.");
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
