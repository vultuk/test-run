const axios = require('axios');
const FormData = require('form-data');
const { default: ask } = require('./ask');

async function fetchGptResponse(text) {
  const documentTypes = "Chairmans report, CIC review docs, Client obligation verification, Complaint, Complaint Acknowledgement, Complaint FRL, Creditor contact, Creditor query, I&E Request, Credit Report, Death Certificate, Engagement Document, Engagement Letter & Proposal Pack, Engagement Pack - IVA Proposal - Signed, EOS (Estimated Outcome Statement), Equity Letter - Signed, Equity Letter - Unsigned, Welcome Pack, Ethics Checklist, Evidence of Child Care, Evidence of Gas & Electric, HP Agreement, I&E, Insolvency Register, Letter to Creditor, MOC Setting Document, Money Laundering Form, Mortgage Statement, NI IP Change Letter, No Claim, Nominee's Report, Notice of Assignment, Overdue Payment, P45, P60, Photographic ID, POD & Proxy, PPI cheque, Proposal Appendices, Proxy, Refund, Rental Agreement, RX1 - Signed, RX1 - Unsigned, RX4, Provisional Proof of Debt, Unable to locate, Subject Access Request, SIP 3.1 Script, SIP 3.1 Stage Advice Checklist, Statement of Account, Tenancy Agreement, Termination documents - Client, Termination documents - Creditor, Termination documents - Insolvency Dept, V5, Signed IVA Proposal, Signed modifications, Full and Final Documents, Deemed Consent Documents, Completion Report- Client, Other cheque, Annual I&E review docs, Annual Review I&E Request, Test, Certificate of Posting, Bank Statements, Call Recording, Child Maintenance, Client Obligation- Child Maintenance Evidence, Council Tax Bill, Creditor Statement / Screenshot / Direct Debit, E-Mail Message, Evidence for Payment Break, Frozen Bank Account Letter, HP Authority Form, Land Registry, Letter from Client, Letter from Creditor, Letter of Authority, Letter to Client, Life Insurance summary docs, Marriage Certificate, MOC adjournment letter, 1st Annual Report - Client, 3rd Annual Report - Client, 2nd Annual Report - Creditor, 5th Annual Report - Creditor, 4th Annual Report - Creditor, 4th Annual Report - Client, 5th Annual Report - Client, Notice of Breach, Notice of Extension- 3 Months, Notice of Extension- 6 Months, Notice of Intended Dividend (NOID), PPI Document, PPI- Third Party Letter/Invoice, Proof of Debt, Self Employment Documentation, 1st Annual Report - Creditor, 7 Day Retention Letter to Client, Asset Documentation, Solicitor Letter, Tax Credit Document, Termination Request from Client, Terms and Conditions, Text Message, Third Party Authority Form, Variation Chairman's Report, Variation Proposal, Vehicle Finance Agreement, Wage Slips, Sick Note, Completion Report- Creditors, Test Document, Annual Report - Client, Annual Report - Creditor, Other Documents, 3rd Annual Report - Creditor, 2nd Annual Report - Client, Evidence of Benefits, Completion Report- Insolvency Service, Mod Documents, Redundancy Documentation, Maternity Document, 1st Annual Reports, 2nd Annual Reports, Engagement Letter & Proposal, Employment Contract, Sale of Property Documents, Approved EOS, Collections- Arrears Chase, RX1 Request, Month 54 Review Outcome, Property Letter- Signed, RX1 Approval Confirmation, Letter to Executor, Letter to Client- DRO Criteria Update, Year 1 Completed I&E, Year 2 Completed I&E, Year 3 Completed I&E, Year 4 Completed I&E, CIC Completed I&E, I&E Outcome- Increase, I&E Outcome- 15% Reduction, I&E Outcome- Neg DI Maintain, I&E Review- Further Information Required, I&E Outcome, I&E Outcome- Maintain, Birth Certificate, Deed Poll, Solicitor Undertaking, HP Car Insurance, HP Car Tax, HP Deposit/Part-exchange/Scrap, Creditor Arrears Letter/ Default Notice, Month 54 Initial Request, Land Registry Requisition";
  const prompt = `Given the text:\n\n"${text}"\n\nFind the document type and reference number from the text using the following comma-separated document types: ${documentTypes}. The reference number format should be three characters (where the first 2 characters are probably "FK") followed by a dash or slash and then a number greater than 0. Please give back the document type and reference number in json with the keys in camel case`;

  return ask(prompt);
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
      body: JSON.stringify(JSON.parse(gptResponse)),
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
