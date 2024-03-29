const axios = require('axios');

async function queryOpenAI(query) {
    const openaiApiKey = process.env.OPENAI;
    const AiSys = process.env.HYPERAISYS
    try {
        // Change the URL to the chat completions endpoint
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo-0125", // Ensure this is the correct model for chat.
            max_tokens: 60,
            messages: [
                {
                    // You can add a system message to enforce rules.
                    role: "system",
                    content: `${AiSys}`
                },
                { 
                    role: "user", 
                    content: query 
                }
            ], // Structure the payload as a sequence of messages.
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            }
        });
        // The structure of the response might be different for chat completions
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error querying OpenAI:', error.response ? error.response.data : error.message);
        return `Error: ${error.response.data.error.message}`;
    }
}

module.exports = queryOpenAI;
