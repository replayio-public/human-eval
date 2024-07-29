import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
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
  const problems = evalProblems
    .toString()
    .split("\n")
    .filter((x) => x.length)
    .map((x) => JSON.parse(x)) as HumanEvalProblem[];

  for (const p of problems) {
    const answer = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt: p.prompt,
    });
    eval(p.prompt + " " + answer.text + "\n" + p.test);
  }
}

main();
