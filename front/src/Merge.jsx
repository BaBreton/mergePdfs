import React, {useState, useCallback, useRef } from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@nextui-org/table";
import { Spinner } from "@nextui-org/spinner";
import { DeleteIcon } from "./DeleteIcon";
import { CrossIcon } from "./CrossIcon";


export default function Merge() {

	const [files, setFiles] = useState([]);
	const [dragOver, setDragOver] = useState(false);
	const [inputKey, setInputKey] = useState(Date.now());
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const fileInputRef = useRef(null);


	const handleDragOver = useCallback((event) => {
		event.preventDefault();
		setDragOver(true);
	}, []);


	const handleDragLeave = useCallback(() => {
		setDragOver(false);
	}, []);


	const handleDrop = useCallback((event) => {
        event.preventDefault();
        setDragOver(false);
        const newFiles = event.dataTransfer.files;
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }, []);


    const handleFileSelect = useCallback((event) => {
		const newFiles = event.target.files;
		console.log(newFiles);
		if (newFiles.length > 0) {
			setFiles((prevFiles) => [...prevFiles, ...Array.from(newFiles)]);
		}
		setInputKey(Date.now());
	}, []);


	const handleDeleteFile = (index) => {
		setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
		setInputKey(Date.now());
	};
	

    const handleClick = () => {
        fileInputRef.current.click();
    };


	const getFileSize = (file) => {
		let size = file.size / 1024;
		if (size > 1024) {
			size = size / 1024;
			return size.toFixed(2) + ' MB';
		} else {
			return size.toFixed(2) + ' KB';
		}
	};


	const getFullSize = () => {
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
	};


	const renderFilesList = () => {
        return (
			<Table aria-label="Files list" className="mt-4">
				<TableHeader>
					<TableColumn>File name</TableColumn>
					<TableColumn>Size</TableColumn>
					<TableColumn>D</TableColumn>
				</TableHeader>
				<TableBody>
					{Array.from(files).map((file, index) => (
						<TableRow key={index}>
							<TableCell>{file.name}</TableCell>
							<TableCell>{getFileSize(file)}</TableCell>
							<TableCell style={{ width: '50px', textAlign: 'center' }}>
								<span className="text-lg text-danger cursor-pointer active:opacity-50">
									<DeleteIcon onClick={() => handleDeleteFile(index)} />
								</span>
							</TableCell>
						</TableRow>
					))}
					<TableRow>
						<TableCell className="text-center font-semibold">
							{files.length} file(s) selected
						</TableCell>
						<TableCell className="text-left font-semibold">{getFullSize()}</TableCell>
						<TableCell></TableCell>
					</TableRow>
				</TableBody>
			</Table>
        );
    };


	const handleMergeFiles = async () => {
		setProcessing(true);
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
			const requestBody = JSON.stringify(filesObject);
			const requestSizeBytes = new Blob([requestBody]).size;
			const requestSizeMb = requestSizeBytes / 1024 / 1024;
			if (requestSizeMb > 10) {
				throw new Error('Total size of files is too large, total size must be less than 10MB');
			}

			const response = await fetch('AWS_LAMBDA_URL', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: requestBody
			});
			console.log("Réponse de l'API:", response);
			if (!response.ok) {
				const error = await response.text();
				const errorObject = JSON.parse(error);
				let errorMessage = errorObject.error;
				if (errorMessage.includes('/tmp/')) {
					errorMessage = errorMessage.replace('/tmp/', '');
				}
				throw new Error(errorMessage);
			}

			const mergedBase64 = await response.text();
			const mergedBlob = base64ToBlob(mergedBase64, 'application/pdf');
			const mergedUrl = URL.createObjectURL(mergedBlob);
			const a = document.createElement('a');
			a.href = mergedUrl;
			a.download = getName();
			document.body.appendChild(a);
			a.click();
			URL.revokeObjectURL(mergedUrl);
			setFiles([]);
			setProcessing(false);

		} catch (error) {
			setError(true);
			setErrorMessage(error.message);
			console.error(error);
		}
	}


	function getName() {
		const date = new Date();
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear().toString().slice(-2);
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');

		const name = `merged-${day}_${month}_${year}-${hours}.${minutes}.pdf`;
		return name;
	}


	function convertToBase64(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = (error) => reject(error);
		});
	}


	function base64ToBlob(base64, mimeType) {
		const byteCharacters = atob(base64);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		return new Blob([byteArray], {type: mimeType});
	}


	const closeErrorDialog = () => {
		setProcessing(false);
		setError(false);
	}


	return (
		<>
		{processing && (
			<div className="flex flex-col overlay">
				{error === true ? (
					<>
						<CrossIcon className="" />
						<p className="text-black text-center mt-4 italic font-extralight">There is an error while merging your files : {errorMessage} .</p>
						<button className="flex items-center mt-4 h-10 bg-transparent border-blue-500 border-2 text-blue-500 hover:bg-blue-500 hover:text-white font-bold py-2 px-4 rounded-2xl" onClick={closeErrorDialog}>Try again</button>
					</>
				) : (
					<>
						<Spinner label="Processing..." color="primary" />
						<p className="text-black text-center mt-4 italic font-extralight">Please wait while we merge your files, the new file will be downloaded automatically.</p>
					</>
				)}
			</div>
		)}
			<div className="h-screen w-full bg-soft-blue">
				<div className="flex flex-col items-center justify-center h-full">
					<h1 className="text-4xl font-bold">Merge PDFs</h1>
					<p className="text-lg mt-3 font-semibold">Upload your [PDF - PNG - JPG - DOCX - TXT] files.</p>
					<p className="text-sm font-semibold italic">Please note that processing DOCX files can be long (~30 seconds).</p>
					<div 
						className={`mt-5 w-6/12 flex flex-col items-center px-4 py-6 bg-white text-blue rounded-lg shadow-lg tracking-wide uppercase border ${dragOver ? 'border-blue-500' : 'border-blue-300'} cursor-pointer hover:bg-blue-100`}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onClick={handleClick}
					>
						<input key={inputKey} ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} multiple style={{ display: 'none' }} />
						<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M16.88 2.88A3 3 0 0 0 14.5 2h-9a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-10a3 3 0 0 0-.62-2.12zM14.5 4a1 1 0 0 1 1 1v2H4.5V5a1 1 0 0 1 1-1h9zM4.5 8h11v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-7zm5 2a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2h-1z"/></svg>
						<p className="mt-2 text-base leading-normal">Drop files here or click to upload</p>
					</div>
					<div className="flex flex-col justify-center w-6/12">
						{files.length > 0 && renderFilesList()}
						<div className="flex justify-center mt-2">
							{files.length > 1 && <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleMergeFiles}>Merge files</button>}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}