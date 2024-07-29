import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import * as fs from "fs/promises";
import path from 'path';
// import uuid from uuid;

const RUN_IDENTIFIER = Date.now() + "";

interface HumanEvalProblem {
  canonical_solution: string;
  declaration: string;
  example_test: string;
  prompt: string;
  task_id: string;
  test: string;
  sanitized_task_id?: string;
}

const _assert = console.assert;

console.assert = (cond: boolean, ...args) => {
  // console.log('HI', cond, ...args, new Error(""))
  if (!cond) {
    throw new Error(`ASSERTION FAILED: ${args}`);
  }
  return _assert(cond, ...args);
};

async function runOneTest(p: HumanEvalProblem) {
  const answer = await generateText({
    model: openai("gpt-3.5-turbo"),
    prompt: p.prompt,
  });

  let err: any;
  try {
  eval(p.prompt + " " + answer.text + "\n" + p.test);
  } catch (_err: any) {
    err  = _err;
  }

  const result = {
    task_id: p.task_id,
    answer: answer.text,
    error: err && {
      stack: err.stack
    }
  };

  const dir = path.join(__dirname, "results", RUN_IDENTIFIER);
  await fs.mkdir(dir, { recursive: true });
  const fpath = path.join(dir, p.sanitized_task_id + ".json");
  const str = JSON.stringify(result, null, 2);
  await fs.writeFile(fpath, str);

  console.log(`Results: ${fpath}`);
}

async function main() {
  const evalProblems = await fs.readFile("data.jsonl");
  const problems = evalProblems
    .toString()
    .split("\n")
    .filter((x) => x.length)
    .map((x) => {
      try {
        return JSON.parse(x);
      } catch (err: any) {
        throw new Error(`JSON.parse failed: ${err.stack}\n\nINPUT: ${x}`);
      }
    }) as HumanEvalProblem[];
  
  for (const p of problems) {
    p.sanitized_task_id = p.task_id.replaceAll("/", "_");
  }
  

  // for (const p of problems) {
  const N = 10;
  // for (const p of problems.slice(0, 10)) {
  for (let i = 0; i < N; ++i) {
    const p = problems[i];
    console.group(`PROBLEM ${i}`);
    await runOneTest(p);
    console.groupEnd();
  }
}

main();
