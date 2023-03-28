const axios = require('axios');
const pdfParse = require('pdf-parse');

async function readPdfText(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const pdfBuffer = Buffer.from(response.data, 'binary');
  const pdfData = await pdfParse(pdfBuffer);

  return pdfData.text;
}

async function fetchGptResponse(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
  const apiUrl = 'https://api.openai.com/v1/engines/davinci-codex/completions';
  const prompt = `Given the text:\n\n"${text}"\n\nFind the document type and reference number from the text using the following comma-separated document types: letter, email, memo. The reference number format should be three characters followed by a dash or slash and then a number greater than 0.`;

  const data = {
    prompt,
    max_tokens: 50,
    n: 1,
    stop: null,
    temperature: 0.5,
  };

  const response = await axios.post(apiUrl, data, { headers });
  return response.data.choices[0].text.trim();
}

exports.handler = async (event, context) => {
  try {
    const url = event.queryStringParameters.url;
    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing PDF URL in the request' }),
      };
    }

    const text = await readPdfText(url);
    const gptResponse = await fetchGptResponse(text);

    return {
      statusCode: 200,
      body: JSON.stringify({ gptResponse }),
    };
  } catch (error) {
    console.error('Error:', error);
    console.log(error.response.data)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while processing the PDF file', data: error.response.data }),
    };
  }
};
