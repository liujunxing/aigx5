import dotenv from 'dotenv';

const localEnv: Record<string, string> = {};
dotenv.config({ processEnv: localEnv });

console.info(`env:`, localEnv);
console.info(`DOUBAO_API_KEY:`, localEnv.DOUBAO_API_KEY);
console.info(`DOUBAO_URL:`, localEnv.DOUBAO_URL);
console.info(`DOUBAO_MODEL:`, localEnv.DOUBAO_MODEL);
