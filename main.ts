import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import * as fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { execSync } from 'child_process';


dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env.secret") });

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    `OPENAI_API_KEY missing. Make sure you have provided it in your .env.secret file.`
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
  if (!cond) {
    throw new Error(`ASSERTION FAILED: ${args}`);
  }
  return _assert(cond, ...args);
};

function extractEvalLine(stackTrace: string, evalCode: string) {
  // Split the stack trace into lines
  const lines = stackTrace.split("\n");

  // Find the line mentioning 'eval'
  let evalLine;
  for (let line of lines) {
    if (line.includes("eval at")) {
      evalLine = line;
      break;
    }
  }

  if (!evalLine) {
    throw new Error("No eval call found in the stack trace.");
  }

  // Extract the line number using a regular expression
  const match = evalLine.match(/<anonymous>:(\d+):\d+/);
  if (!match) {
    throw new Error("Could not find line number in the eval call.");
  }

  const lineNumber = parseInt(match[1], 10);

  // Get the corresponding line of code from the evalCode array
  if (lineNumber - 1 < evalCode.length) {
    const codeLine = evalCode.split("\n")[lineNumber - 1];
    return codeLine;
  } else {
    throw new Error(
      "Line number from stack trace exceeds length of eval code."
    );
  }
}

function makeTestCode(p: HumanEvalProblem, answer: string) {
  const header = (s: string) =>
    `\n\n// ###################\n// ${s}\n// ###################\n`;
  return (
    `
    (()=>{
    ${header("PROMPT")}${p.prompt}
    ${header("ANSWER")}${answer}
    ${header("TEST")}${p.test}
    })()
    `

  );
}

interface ProblemResult {
  error: { stack: string; failedAssert: string } | null;
  task_id: string;
  problem: HumanEvalProblem;
  response: string;
}

async function tryProblem(
  problem: HumanEvalProblem,
  previousResult?: ProblemResult
): Promise<ProblemResult> {
  // You previously wrote this code: <PREVIOUS CODE>
  // That broke with this error: <ERROR>
  // Please try again. Respond only with JavaScript. Do not repeat anything in this prompt.
  // Original Instructions: <PROMPT>


  const myPrompt = previousResult ? `
You previously wrote this code:

  \`\`\`
  ${problem.declaration}
  ${previousResult.response}
  \`\`\`

  That broke with this error:
  \`\`\`
  ${previousResult.error}
  \`\`\`
  The test case thet didn't pass was this one:
  \`\`\`
  ${previousResult.error?.failedAssert}
  \`\`\`
  Please try again. Respond only with JavaScript.
  Original Instructions:
  ${problem.prompt}
` : problem.prompt;

  // if (previousResult) {
  //   console.log(':poop:')
  //   console.log(myPrompt)
  //   0();
  //   process.exit();
  // }

  const answer = await generateText({
    model: openai("gpt-3.5-turbo"),
    prompt: myPrompt,
  });

  let err: Error | undefined;
  const code = makeTestCode(problem, answer.text);
  try {
    {
      // eval(code);
      const tempFilePath = path.join(__dirname, `temp_${Math.random().toString(36).substring(2, 15)}.js`);
      await fs.writeFile(tempFilePath, code);
      // try {
      // const output = execSync(`node ${tempFilePath}`, { stdio: ['pipe', 'pipe', 'pipe'] });
      // console.log('file', tempFilePath)
      // console.log(`stdout: ${output.toString()}`);
      require(tempFilePath)
      // console.error(`stderr: ${output.stderr.toString()}`);
      // } catch (error: any) {
      //   console.error(`exec error: ${error}`);
      //   err = error;
      // }
    }
  } catch (_err: any) {
    err = _err;
    console.log(err);
  }

  const result: ProblemResult = {
    problem,
    task_id: problem.task_id,
    response: code,
    error: err
      ? {
        stack: err.stack as string,
        failedAssert: extractEvalLine(err.stack!, code),
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

  console.log(`${problem.declaration}
${answer.text}`);
  console.log(`Results: ${resultJsonPath}`);
  console.log(`JS (prompt+answer+test): ${resultAnswerPath}`);
  if (err) {
    console.log(`Failed on ${problem.task_id}: ${err}`);
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
    p.sanitized_task_id = p.task_id.replaceAll("/", "_");
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
      result = await tryProblem(p, result);
      if (!result.error) {
        break;
      }
      attempts++;
    }
    console.groupEnd();
  }
}

main();
