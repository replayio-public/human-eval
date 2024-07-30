import { extractErrorLines } from "./util"; // Adjust the import path as needed

test("extractErrorLines function", () => {
  const dummyCode = `
function example() {
  console.log("Hello");
  throw new Error("Test error");
}
example();
  `;

  const dummyFilePath = "/home/user/test/example.js";

  // Test case 1: Normal stack trace
  const normalStackTrace = `Error: Test error
    at example (${dummyFilePath}:4:9)
    at Object.<anonymous> (${dummyFilePath}:6:1)`;

  const result1 = extractErrorLines(normalStackTrace, dummyCode, dummyFilePath);
  expect(result1).toHaveLength(2);
  expect(result1[0]).toBe('  throw new Error("Test error");');

  // Test case 2: Stack trace with no line numbers
  const noLineNumbersStackTrace = `Error: Test error
    at example (${dummyFilePath})
    at Object.<anonymous> (${dummyFilePath})`;

  expect(() =>
    extractErrorLines(noLineNumbersStackTrace, dummyCode, dummyFilePath)
  ).toThrow("Could not find any line numbers in stackframe");

  // Test case 3: Stack trace with line number but no column number
  const noColumnNumberStackTrace = `Error: Test error
    at example (${dummyFilePath}:4)
    at Object.<anonymous> (${dummyFilePath}:6)`;

  const result3 = extractErrorLines(
    noColumnNumberStackTrace,
    dummyCode,
    dummyFilePath
  );
  expect(result3).toHaveLength(2);
  expect(result3[0]).toBe('  throw new Error("Test error");');
  expect(result3[1]).toBe("example();");

  // Test case 4: Stack trace with no matching file path
  const noMatchingPathStackTrace = `Error: Test error
    at example (/some/other/path.js:4:9)
    at Object.<anonymous> (/some/other/path.js:6:1)`;

  expect(() =>
    extractErrorLines(noMatchingPathStackTrace, dummyCode, dummyFilePath)
  ).toThrow("Error outside of test case");
});
