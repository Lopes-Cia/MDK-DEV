import { execSync } from "node:child_process";

function isGitRepo() {
  try {
    const out = execSync("git rev-parse --is-inside-work-tree", { encoding: "utf8" }).trim();
    return out === "true";
  } catch {
    return false;
  }
}

function listTrackedFiles() {
  const out = execSync("git ls-files -z", { encoding: "utf8" });
  return out.split("\0").filter(Boolean);
}

function main() {
  if (!isGitRepo()) {
    process.stdout.write(JSON.stringify({ ok: true, skipped: true }, null, 2) + "\n");
    return;
  }

  const files = listTrackedFiles();
  const offenders = files.filter((f) => f.includes("node_modules/"));

  if (offenders.length > 0) {
    process.stderr.write(
      JSON.stringify(
        { ok: false, reason: "vendored_node_modules", count: offenders.length, samples: offenders.slice(0, 20) },
        null,
        2
      ) + "\n"
    );
    process.exit(1);
  }

  process.stdout.write(JSON.stringify({ ok: true }, null, 2) + "\n");
}

main();
