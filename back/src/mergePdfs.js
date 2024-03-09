const fs = require('fs');
const os = require('os');
const { PDFDocument } = require('pdf-lib');
const { convertToPdf } = require('./converters');
const path = require('path');


function saveBase64AsFile(base64, fileName) {
	const tempDir = os.tmpdir();
	const filePath = path.join(tempDir, fileName);
	const buffer = Buffer.from(base64, 'base64');

	fs.writeFileSync(filePath, buffer);

	return filePath;
}


async function mergePdfs(paths) { // take array of files, convert to pdf and merge
	const mergedPdf = await PDFDocument.create();

	for (const inputPath of paths) {
		const pdfDoc = await convertToPdf(inputPath);
		const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
		copiedPages.forEach((page) => {
			mergedPdf.addPage(page);
		});
	}

	const mergedPdfFile = await mergedPdf.save();
	const base64pdf = Buffer.from(mergedPdfFile).toString('base64');
	return base64pdf;
}


exports.handler = async (event) => {
	try {
		const filesInfo = JSON.parse(event.body).files;
		const tempPaths = filesInfo.map(fileInfo => saveBase64AsFile(fileInfo.content, fileInfo.name));
		const base64Pdf = await mergePdfs(tempPaths)

		tempPaths.forEach(fs.unlinkSync);

		return {
			statusCode: 200,
			body: base64Pdf,
			headers : {
				'Content-Type': 'text/plain',
			},
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: error.message }),
			headers : { 'Content-Type': 'application/json' },
		};
	}
};
