const fs = require('fs');
const os = require('os');
const { PDFDocument } = require('pdf-lib');
const { convertToPdf } = require('./converters');
const path = require('path');


function saveBase64AsFile(base64, fileName) { // Convert the base64 to a file and save it in the /tmp directory
	const tempDir = os.tmpdir();
	const filePath = path.join(tempDir, fileName);
	const buffer = Buffer.from(base64, 'base64');

	fs.writeFileSync(filePath, buffer);

	return filePath;
}


async function mergePdfs(paths) { // Take array of files, convert to pdf and merge
	const mergedPdf = await PDFDocument.create();

	for (const inputPath of paths) {
		const pdfDoc = await convertToPdf(inputPath);
		const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
		copiedPages.forEach((page) => {
			mergedPdf.addPage(page);
		});
	}

	const mergedPdfFile = await mergedPdf.save();
	const base64pdf = Buffer.from(mergedPdfFile).toString('base64'); // Convert the merged file to base64 to send it to the front-end
	return base64pdf;
}


exports.handler = async (event) => {
	try {
		const filesInfo = JSON.parse(event.body).files; // Get the files from the request body
		const tempPaths = filesInfo.map(fileInfo => saveBase64AsFile(fileInfo.content, fileInfo.name)); // Convert the files to base64 and save them in the /tmp directory to convert them to PDF
		const base64Pdf = await mergePdfs(tempPaths) // Main function that merges the files and returns the merged file in base64 format

		tempPaths.forEach(fs.unlinkSync); // Delete the files from the /tmp directory

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
