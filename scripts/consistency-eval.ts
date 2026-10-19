// Runs the consistency test set. Prints the plan by default and spends nothing.
//
//   node --experimental-strip-types scripts/consistency-eval.ts
//   EVAL_COOKIE='sb-...=...' EVAL_CHARACTERS=id1,id2,id3 BASE_URL=http://localhost:3000 \
//     node --experimental-strip-types scripts/consistency-eval.ts --run
//
// --run makes real generations, so it spends credits from the signed in account. Create the three test characters
// first (EVAL_CHARACTERS holds their ids in order A, B, C), using the profiles in src/config/eval-set.ts.

// @ts-expect-error Node needs the .ts extension to run this file directly.
import { EVAL_CHARACTERS, EVAL_MODELS, EVAL_POSTS } from "../src/config/eval-set.ts";

const run = process.argv.includes("--run");
const base = process.env.BASE_URL ?? "http://localhost:3000";
const ids = (process.env.EVAL_CHARACTERS ?? "").split(",").filter(Boolean);
const only = process.env.EVAL_MODELS?.split(",").filter(Boolean);
const models = only ?? EVAL_MODELS;

const total = EVAL_CHARACTERS.length * EVAL_POSTS.length * models.length;
console.log(`${EVAL_CHARACTERS.length} characters x ${EVAL_POSTS.length} posts x ${models.length} models = ${total} generations`);
console.log(`models: ${models.join(", ")}`);
for (const c of EVAL_CHARACTERS) console.log(`character ${c.label}: ${c.profile}`);
EVAL_POSTS.forEach((p, i) => console.log(`post ${i + 1}: ${p.templateId}${p.asStill ? " (still)" : ""} ${JSON.stringify(p.blanks)}${p.outfit ? ` outfit=${p.outfit}` : ""}`));

if (!run) {
  console.log("\nDry run. Nothing was generated. Add --run to spend credits.");
  process.exit(0);
}
if (ids.length !== EVAL_CHARACTERS.length || !process.env.EVAL_COOKIE) {
  console.error("Set EVAL_CHARACTERS to three character ids and EVAL_COOKIE to a signed in session cookie.");
  process.exit(1);
}

const rows: string[] = ["character,post,template,model,status,job,prompt_version"];
for (const [ci, c] of EVAL_CHARACTERS.entries()) {
  for (const [pi, p] of EVAL_POSTS.entries()) {
    for (const model of models) {
      const res = await fetch(`${base}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: process.env.EVAL_COOKIE },
        body: JSON.stringify({ modelKey: model, characterId: ids[ci], templateId: p.templateId, blanks: p.blanks, asStill: p.asStill, outfit: p.outfit }),
      });
      const body = (await res.json()) as { job?: { id: string; status: string; params?: { promptVersion?: string } }; error?: string };
      const line = [c.label, pi + 1, p.templateId, model, res.ok ? body.job?.status : `error: ${body.error}`, body.job?.id ?? "", body.job?.params?.promptVersion ?? ""].join(",");
      rows.push(line);
      console.log(line);
    }
  }
}
await import("node:fs").then((fs) => fs.writeFileSync("consistency-eval-results.csv", rows.join("\n") + "\n"));
console.log("\nWrote consistency-eval-results.csv. Score each result with docs/consistency-scoring.md.");
