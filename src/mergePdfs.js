const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');


async function convertToPdf(inputPath) {
	const ext = path.extname(inputPath).toLowerCase();
	let pdfDoc;

	if (ext === '.pdf') {
		const pdfBytes = fs.readFileSync(inputPath);
		pdfDoc = await PDFDocument.load(pdfBytes);
	} else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
		const imgBytes = fs.readFileSync(inputPath);
		pdfDoc = await PDFDocument.create();
		const img = await pdfDoc[ext === '.png' ? 'embedPng' : 'embedJpg'](imgBytes);
		const page = pdfDoc.addPage([img.width, img.height]);
		page.drawImage(img, {
			x: 0,
			y: 0,
			width: img.width,
			height: img.height,
		});
	} else if (ext === '.txt') {
		pdfDoc = await PDFDocument.create();
		const txt = fs.readFileSync(inputPath, 'utf-8');
		const page = pdfDoc.addPage();
		const { width, height } = page.getSize();
		const fontSize = 12;
		page.drawText(txt, {
			x: 50,
			y: height - 50 - fontSize,
			size: fontSize,
			color: rgb(0, 0, 0),
		});
	} else {
		throw new Error('Unsupported file type');
	}

	return pdfDoc;

}


async function mergePdfs(paths) {
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
		'./three.jpg',
		'./four.png',
		'./five.txt',
	];
	const mergedPdf = await mergePdfs(pdfs);

	const output = './merged.pdf';
	fs.writeFileSync(output, mergedPdf);
}

runMerge().catch(err => console.log(err));