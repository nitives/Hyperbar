import { pipeline } from "@xenova/transformers";

// Create a text-generation pipeline
const generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-783M');



async function queryOpenAI(query) {
    const text = 'how can I become more healthy?';
    const output = await generator(text);
    console.log(output);

    const output2 = await generator(text, { max_new_tokens: 60 });
    console.log(output2);

    return output2;
}

export default queryOpenAI;