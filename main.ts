import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import * as fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { extractErrorLines, HumanEvalProblem, makeTestCode, ProblemResult, sanitizeFileName } from './util';

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env.secret") });

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    `OPENAI_API_KEY missing. Make sure you have provided it in your .env.secret file.`
  );
}

const RUN_IDENTIFIER = Date.now() + "";

const _assert = console.assert;

console.assert = (cond: boolean, ...args) => {
  if (!cond) {
    throw new Error(`ASSERTION FAILED: ${args}`);
  }
  return _assert(cond, ...args);
};

async function tryProblem(
  problem: HumanEvalProblem,
  previousResult: ProblemResult | undefined,
  i: number
): Promise<ProblemResult> {
  // You previously wrote this code: <PREVIOUS CODE>
  // That broke with this error: <ERROR>
  // Please try again. Respond only with JavaScript. Do not repeat anything in this prompt.
  // Original Instructions: <PROMPT>

  // TODO: This does not produce correct JS on the second run.
  // We could not add tests on follow-up runs. 
  TODO;
  const myPrompt = previousResult
    ? `
You previously wrote this code:

  \`\`\`
  ${problem.declaration}
  ${previousResult.response}
  \`\`\`

  That broke with this error:
  \`\`\`
  ${previousResult.error}
  \`\`\`
  The failure was on these lines:
  \`\`\`
  ${previousResult.error?.failedAssert?.join("\n")}
  \`\`\`
  Please try again. Respond only with JavaScript. DO NOT include the test case. Only the solution. Make sure to match the initial open brace.
  Original Instructions:
  ${problem.prompt}
`
    : problem.prompt;

  const answer = await generateText({
    model: openai("gpt-3.5-turbo"),
    prompt: myPrompt,
  });

  let err: Error | undefined;
  const code = makeTestCode(problem, answer.text);
  const testFname = `PROBLEM_${problem.sanitized_task_id}_${i}.js`;
  const testFilePath = path.join(__dirname, testFname);
  console.group(`Running test "${testFilePath}"...`);
  try {
    {
      // eval(code);
      await fs.writeFile(testFilePath, code);
      require(testFilePath);
    }
  } catch (_err: any) {
    err = _err;
  }
  console.groupEnd();

  const result: ProblemResult = {
    problem,
    task_id: problem.task_id,
    response: code,
    i,
    error: err
      ? {
          stack: err.stack as string,
          failedAssert: extractErrorLines(err.stack!, code, testFilePath),
        }
      : null,
  };

  const dir = path.join(__dirname, "results", RUN_IDENTIFIER);
  await fs.mkdir(dir, { recursive: true });

  const resultJsonPath = path.join(
    dir,
    problem.sanitized_task_id + ".result.json"
  );
  const str = JSON.stringify(result, null, 2);
  await fs.writeFile(resultJsonPath, str);

  const resultAnswerPath = path.join(dir, problem.sanitized_task_id + ".js");
  await fs.writeFile(
    resultAnswerPath,
    code + (err ? `\n\n/*\n ${err.stack}\n*/` : "")
  );

  if (err) {
    console.log(`Failed on ${problem.task_id}: ${err.stack}`);
  }
  return result;
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
    p.sanitized_task_id = sanitizeFileName(p.task_id);
  }

  const startProblem = 10;
  const endProblem = 11;
  const MaxAttempts = 3;
  for (let i = startProblem; i < endProblem; ++i) {
    let attempts = 1;
    const p = problems[i];
    let result;
    console.group(`PROBLEM ${i}/ATTEMPT ${attempts}`);
    while (attempts <= MaxAttempts) {
      result = await tryProblem(p, result || undefined, attempts);
      if (!result.error) {
        break;
      }
      attempts++;
    }
    console.groupEnd();
  }
}

main();
