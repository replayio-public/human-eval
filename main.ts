import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import * as fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env.secret") });

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    `OPENAI_API_KEY missing. Make sure you have provided it in your .env.secret file.`,
  );
}

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

function makeTestCode(p: HumanEvalProblem, answer: string) {
  const header = (s: string) =>
    `\n\n// ###################\n// ${s}\n// ###################\n`;
  return (
    `${header("PROMPT")}${p.prompt}\n` +
    `${header("ANSWER")}${answer}` +
    `${header("TEST")}${p.test}`
  );
}

async function runOneTest(p: HumanEvalProblem) {
  const answer = await generateText({
    model: openai("gpt-3.5-turbo"),
    prompt: p.prompt,
  });

  let err: any;
  const code = makeTestCode(p, answer.text);
  try {
    eval(code);
  } catch (_err: any) {
    err = _err;
  }

  const result = {
    task_id: p.task_id,
    error: err && {
      stack: err.stack,
    },
  };

  const dir = path.join(__dirname, "results", RUN_IDENTIFIER);
  await fs.mkdir(dir, { recursive: true });

  const resultJsonPath = path.join(dir, p.sanitized_task_id + ".result.json");
  const str = JSON.stringify(result, null, 2);
  await fs.writeFile(resultJsonPath, str);

  const resultAnswerPath = path.join(dir, p.sanitized_task_id + ".js");

  await fs.writeFile(
    resultAnswerPath,
    code + (err ? `\n\n/*\n ${err.stack}\n*/` : "")
  );

  if (err) {
    console.log(`Failed on ${p.task_id}: ${err}`);
  }
  console.log(`Results: ${resultJsonPath}`);
  console.log(`JS (prompt+answer+test): ${resultAnswerPath}`);
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

  const startProblem = 10;
  const endProblem = 20;
  // for (const p of problems) {
  // for (const p of problems.slice(0, 10)) {
  for (let i = startProblem; i < endProblem; ++i) {
    const p = problems[i];
    console.group(`PROBLEM ${i}`);
    await runOneTest(p);
    console.groupEnd();
  }
}

main();
