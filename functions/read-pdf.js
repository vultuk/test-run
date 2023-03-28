const axios = require('axios');
const FormData = require('form-data');

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

async function pdfToText(pdfUrl) {
  const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
  const pdfBuffer = response.data;

  const formData = new FormData();
  formData.append('file', pdfBuffer, 'document.pdf');
  formData.append('language', 'eng');
  formData.append('apikey', process.env.OCR_API_KEY);

  const ocrResponse = await axios.post('https://api.ocr.space/parse/image', formData, {
    headers: formData.getHeaders(),
  });

  if (ocrResponse.data.IsErroredOnProcessing) {
    throw new Error(ocrResponse.data.ErrorMessage.join(', '));
  }

  const parsedText = ocrResponse.data.ParsedResults.map((result) => result.ParsedText).join('');
  return parsedText;
}


exports.handler = async (event, context) => {
  const pdfUrl = event.queryStringParameters.url;

  if (!pdfUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing PDF URL in the request' }),
    };
  }


  try {
    const text = await pdfToText(pdfUrl);
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
