import axios from 'axios';

// Function to send user query to OpenAI API
async function queryOpenAI(query) {
    const openaiApiKey = process.env.OPENAI; // Accessing API key from environment variable

    try {
        const response = await axios.post('https://api.openai.com/v1/completions', {
            prompt: query,
            max_tokens: 150, // Adjust as needed
            temperature: 0.7, // Adjust as needed
            n: 1,
            stop: '\n'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            }
        });
        return response.data.choices[0].text.trim(); // Extract AI's response
    } catch (error) {
        console.error('Error querying OpenAI:', error);
        return 'Error: Unable to process your query'; // Handle errors gracefully
    }
}

export { queryOpenAI }; // Export the function for use in other modules