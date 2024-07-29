import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const { text } = await generateText({
  model: openai("gpt-3.5-turbo"),
  prompt: `2 + 2 =`,
});

console.log(text);
