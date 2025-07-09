import { create_ai, execute_query } from "./llm";

async function main() {
  const ai = create_ai();
  const response = await execute_query(ai, "今天北京天气如何?");
  console.info(`[weather] response: `, response);
  console.info(`  [weather] content: `, response?.choices?.[0]?.message?.content);
  console.info(`  [weather] tool_calls:`, response?.choices?.[0]?.message?.tool_calls);
}

main();
