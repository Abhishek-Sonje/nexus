import { runCompletePipeline } from '../pipeline';

const result = await runCompletePipeline();
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
