const axios = require('axios');

async function fetchGptResponse(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const prompt = `Given the text:\n\n"${text}"\n\nFind the document type and reference number from the text using the following comma-separated document types: letter, email, memo. The reference number format should be three characters followed by a dash or slash and then a number greater than 0.`;

  console.log(prompt);

  const data = {
    model: "gpt-3.5-turbo",
    messages: [{"role": "user", "content": prompt}]
  };

  const response = await axios.post(apiUrl, data, { headers });
  return response.data.choices[0].message.content.trim();
}

exports.handler = async (event, context) => {
  try {
    const gptResponse = await fetchGptResponse(text);

    return {
      statusCode: 200,
      body: JSON.stringify({ gptResponse }),
      text
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while processing the PDF file', data: error?.response?.data ?? error }),
    };
  }
};
