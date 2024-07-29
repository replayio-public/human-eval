import * as fs from "fs/promises";

interface HumanEvalProblem {
  canonical_solution: string;
  declaration: string;
  example_test: string;
  prompt: string;
  task_id: string;
  test: string;
}

async function main() {
  const evalProblems = await fs.readFile("data.jsonl");
  console.log(
    evalProblems
      .toString()
      .split("\n")
      .filter((x) => x.length)
      .map((x) => JSON.parse(x)),
  );
}

main();
