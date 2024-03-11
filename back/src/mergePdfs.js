const fs = require('fs');
const os = require('os');
const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');
const mammoth = require("mammoth");
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');


let browserInstance;

async function initBrowser() {
    browserInstance = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });
}


function saveBase64AsFile(base64, fileName) {
	const tempDir = os.tmpdir();
	const filePath = path.join(tempDir, fileName);
	const buffer = Buffer.from(base64, 'base64');

	fs.writeFileSync(filePath, buffer);

	return filePath;
}


async function convertImage(inputPath, ext) {
	try {
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
	} catch (err) {
		console.error('Error during image conversion: ', err);
		err.message = 'Error during image conversion: ' + err.message;
		throw err;
	}
}


async function convertTxt(inputPath) { // convert txt to pdf, not best way, but works
	try {
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
	} catch (err) {
		console.error('Error during txt conversion: ', err);
		err.message = 'Error during txt conversion: ' + err.message;
		throw err;
	}	
}


async function convertDocx(inputPath) {
	try {
		const result = await mammoth.convertToHtml({ path: inputPath });
        const html = result.value;
        const page = await browserInstance.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf();
        await page.close();

        const pdfDoc = await PDFDocument.load(pdfBuffer);

        return pdfDoc;
	} catch (err) {
		console.error('Error during docx conversion: ', err);
		err.message = 'Error during docx conversion: ' + err.message;
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
		const error = new Error('Unsupported file type for ' + inputPath + ' : ' + ext);
		console.error(error);
		throw error;
	}

	return pdfDoc;
}


async function mergePdfs(paths) { // take array of files, convert to pdf and merge
	const mergedPdf = await PDFDocument.create();
	let docxFiles = false;

	if (paths.some(filePath => path.extname(filePath).toLowerCase() === '.docx') === true) {
		docxFiles = true;
		await initBrowser();
	}

	for (const inputPath of paths) {
		const pdfDoc = await convertToPdf(inputPath);
		const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
		copiedPages.forEach((page) => {
			mergedPdf.addPage(page);
		});
	}

	if (docxFiles) {
		await browserInstance.close();
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