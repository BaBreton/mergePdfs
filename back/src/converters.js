const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');
const mammoth = require("mammoth");
const puppeteer = require('puppeteer');


async function convertImage(inputPath, ext) {
	const imgBytes = fs.readFileSync(inputPath);
	const pdfDoc = await PDFDocument.create();
	const img = await pdfDoc[ext === '.png' ? 'embedPng' : 'embedJpg'](imgBytes);
	const page = pdfDoc.addPage([img.width, img.height]);
	page.drawImage(img, {
		x: 0,
		y: 0,
		width: img.width,
		height: img.height,
	});
	
	return pdfDoc;
}


async function convertTxt(inputPath) { // convert txt to pdf, not best way, but works
	const pdfDoc = await PDFDocument.create();
	const txt = fs.readFileSync(inputPath, 'utf-8');
	const fontSize = 12;
	const margin = 50;
	const lines = txt.split('\n');
	let currentPage = null;
	let y = 0;

	const createPage = () => {
		currentPage = pdfDoc.addPage();
		y = currentPage.getSize().height - margin; // reset Y for new page
		return currentPage;
	};

	createPage();

	lines.forEach(line => {
		while (line.length > 0) {
			if (y < fontSize + margin) { // verif space for new line
				createPage();
			}
			const { width } = currentPage.getSize();
			const textWidth = width - 2 * margin;
			const charsPerLine = Math.floor(textWidth / (fontSize * 0.6)); // it's "a peu pres"
			const segment = line.substring(0, charsPerLine);
			line = line.substring(charsPerLine);

			currentPage.drawText(segment, {
				x: margin,
				y: y,
				size: fontSize,
				color: rgb(0, 0, 0),
			});

			y -= fontSize + 5;
		}
		y -= 5;
	});

	return pdfDoc;
}


async function convertDocx(inputPath) {
	try {
		const result = await mammoth.convertToHtml({ path: inputPath });
		const html = result.value;
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: 'networkidle0' }); // check if all network connections are done
		const pdfBuffer = await page.pdf(); // get buffer with pdf

		await browser.close();

		const pdfDoc = await PDFDocument.load(pdfBuffer);

		return pdfDoc;
	} catch (err) {
		console.error('Error during docx conversion:', err);
		throw err;
	}
}



async function convertToPdf(inputPath) { // take one files, check type and convert to pdf
	const ext = path.extname(inputPath).toLowerCase();
	let pdfDoc;

	if (ext === '.pdf') {
		const pdfBytes = fs.readFileSync(inputPath);
		pdfDoc = await PDFDocument.load(pdfBytes);
	} else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
		pdfDoc = await convertImage(inputPath, ext);
	} else if (ext === '.txt') {
		pdfDoc = await convertTxt(inputPath);
	} else if (ext === '.docx') {
		pdfDoc = await convertDocx(inputPath);
	} else {
		throw new Error('Unsupported file type');
	}

	return pdfDoc;
}

module.exports = { convertToPdf };