export const useUtils = () => {

	const getFileSize = (file) => {
		let size = file.size / 1024;
		if (size > 1024) {
			size = size / 1024;
			return size.toFixed(2) + ' MB';
		} else {
			return size.toFixed(2) + ' KB';
		}
	}


	const getFullSize = (files) => {
		let size = 0;
		Array.from(files).forEach((file) => {
			size += file.size;
		});
		size = size / 1024;
		if (size > 1024) {
			size = size / 1024;
			return size.toFixed(2) + ' MB';
		} else {
			return size.toFixed(2) + ' KB';
		}
	}


	function getName() {
		const date = new Date();
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `merged-${year}_${month}_${day}-${hours}.${minutes}.pdf`;
	}


	function convertToBase64(file) { // Convert all files to base64 to send them to the AWS Lambda function
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = (error) => reject(error);
		});
	}


	function base64ToBlob(base64, mimeType) { // Convert the base64 to a blob to download the merged file
		const byteCharacters = atob(base64);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		return new Blob([byteArray], {type: mimeType});
	}


	async function getRequestBody(files) { // Convert the files to base64 and return the request body. The lambda take a the file name with extension to identify the files and how to merge them.
		try {
			const base64Files = await Promise.all(
				Array.from(files).map(async (file) => {
					const base64 = await convertToBase64(file);
					const content = base64.split(',')[1];
					return {
						name: file.name,
						content: content
					};
				})
			);
			const filesObject = { files: base64Files };
			console.log(filesObject);
			return JSON.stringify(filesObject);
		}
		catch (error) {
			throw new Error(error.message);
		}
	}


	function checkRequestSize(requestBody) {
		const requestSizeBytes = new Blob([requestBody]).size;
		const requestSizeMb = requestSizeBytes / 1024 / 1024;
		if (requestSizeMb > 10) {
			throw new Error('Total size of files is too large, total size must be less than 10MB');
		}
	}


	async function handleErrors(response) {
		if (!response.ok) {
			const error = await response.text();
			const errorObject = JSON.parse(error);
			let errorMessage = errorObject.error;
			if (errorMessage.includes('/tmp/')) { // Remove the /tmp/ prefix from the error message, cause i stock the files in /tmp/ folder in the lambda
				errorMessage = errorMessage.replace('/tmp/', '');
			}
			throw new Error(errorMessage);
		}
		return response;
	}


	async function getMergedBase64(requestBody) {
		return new Promise(async (resolve, reject) => {
			try {
				const response = await fetch('AWS_LAMBDA_URL', { // Call the AWS Lambda function to merge the files. Can be replaced by an AWS API Gateway URL, but works fine with the lambda URL
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: requestBody
				});
				await handleErrors(response); // Handle the errors from the AWS Lambda function
				const mergedBase64 = await response.text();
				resolve(mergedBase64);
			} catch (error) {
				reject(error);
			}
		});
	}


	function automaticDownload(base64) {
		const blob = base64ToBlob(base64, 'application/pdf');
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = getName();
		document.body.appendChild(a);
		a.click();
		URL.revokeObjectURL(url);
	}


	return {
		getFileSize,
		getFullSize,
		getRequestBody,
		checkRequestSize,
		getMergedBase64,
		automaticDownload
	}
};