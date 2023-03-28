const axios = require('axios');
const pdfjsLib = require('pdfjs-dist/es5/build/pdf');
const Tesseract = require('tesseract.js');
const path = require('path');

pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, './node_modules/pdfjs-dist/es5/build/pdf.worker.js');

async function readPdfText(pdfUrl) {
  const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
  const data = new Uint8Array(response.data);
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

  exports.handler = async (event, context) => {
    const url = event.queryStringParameters.url;
    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing PDF URL in the request' }),
      };
    }

    const text = await readPdfText(url);

    return {
        statusCode: 500,
        body: JSON.stringify(text),
      };
  }