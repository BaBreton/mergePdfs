const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { convertToPdf } = require('./converters');


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
	return mergedPdfFile;
}

async function runMerge() {
	const pdfs = [
		'./one.pdf',
		'./two.pdf',
		// './three.jpg',
		'./four.png',
		// './five.txt',
	];
	const mergedPdf = await mergePdfs(pdfs);

	const output = './merged.pdf';
	fs.writeFileSync(output, mergedPdf);
}

runMerge().catch(err => console.log(err));