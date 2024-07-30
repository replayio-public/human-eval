import { execSync } from "child_process";


export interface HumanEvalProblem {
  canonical_solution: string;
  declaration: string;
  example_test: string;
  prompt: string;
  task_id: string;
  test: string;
  sanitized_task_id?: string;
}

export function extractErrorLines(
  stackTrace: string,
  evalCode: string,
  filePath: string
) {
  // Split the stack trace into lines
  const lines = stackTrace.split("\n");

  // Find the line mentioning 'eval'
  const matchingLines = lines.filter((l) => l.includes(filePath));

  if (!matchingLines.length) {
    throw new Error("Error outside of test case: " + stackTrace);
  }

  // Extract the line number using a regular expression
  const codeLines = evalCode.split("\n");
  console.log("DDBG LINE0: ", codeLines[0]);
  const match = matchingLines.map((l) => {
    const i = l.indexOf(filePath) + filePath.length + 1;
    const str = l.substring(i);
    // console.log(`LINE MATCH "${filePath}" ${l.match(`(\d+):\d+`)?.[0]}`);
    const m = str.match(/(\d+)(?::\d+)?/);
    if (!m) {
      throw new Error(
        `Could not find any line numbers in stackframe: "${str}" ${l} --- ${stackTrace}`
      );
    }
    const lineNumber = parseInt(m[1], 10);

    // Get the corresponding line of code from the evalCode array
    if (lineNumber - 1 < evalCode.length) {
      console.log("DDBG LINE ", lineNumber, codeLines.join("\n"));
      const codeLine = codeLines[lineNumber - 1];
      return codeLine;
    } else {
      throw new Error(
        "Line number from stack trace exceeds length of eval code."
      );
    }
  });
  return match;
}

export function makeTestCode(p: HumanEvalProblem, answer: string) {
  const header = (s: string) =>
    `\n\n// ###################\n// ${s}\n// ###################\n`;
  return `
    (()=>{
    ${header("PROMPT")}${p.prompt}
    ${header("ANSWER")}${answer}
    ${header("TEST")}${p.test}
    })()
    `;
}

export interface ProblemResult {
  error: { stack: string; failedAssert: string[] } | null;
  task_id: string;
  problem: HumanEvalProblem;
  response: string;
  i: number;
}

export function sanitizeFileName(s: string) {
  return s.replaceAll("/", "_");
}
