const axios = require('axios');
const fetch = require('node-fetch');
const pdfjsLib = require('pdfjs-dist/es5/build/pdf');
const Tesseract = require('tesseract.js');
const path = require('path');

// Set the worker directory for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, './node_modules/pdfjs-dist/es5/build/pdf.worker.js');


async function readPdfText(pdfUrl) {
  const response = await fetch(pdfUrl);
  const data = new Uint8Array(await response.arrayBuffer());
  const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
  const totalPages = pdfDocument.numPages;
  let fullText = '';

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = Tesseract.createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    await page.render(renderContext).promise;
    const result = await Tesseract.recognize(canvas);
    fullText += result.data.text;
  }

  return fullText;
}

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
