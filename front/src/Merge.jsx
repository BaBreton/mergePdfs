import React, {useState, useEffect, useCallback, useRef } from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@nextui-org/table";
import { Spinner } from "@nextui-org/spinner";
import { DeleteIcon } from "./DeleteIcon";


export default function Merge() {

	const [files, setFiles] = useState([]);
	const [dragOver, setDragOver] = useState(false);
	const [inputKey, setInputKey] = useState(Date.now());
	const [processing, setProcessing] = useState(false);
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
							<TableCell>{Math.round(file.size / 1024)} KB</TableCell>
							<TableCell style={{ width: '50px', textAlign: 'center' }}>
								<span className="text-lg text-danger cursor-pointer active:opacity-50">
									<DeleteIcon onClick={() => handleDeleteFile(index)} />
								</span>
							</TableCell>
						</TableRow>
					))}
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
			console.log("Envoi à l'API:", filesObject);

			const response = await fetch('AMAZON_LAMBDA_URL', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(filesObject)
			});
			console.log("Réponse de l'API:", response);
			if (!response.ok) {
				throw new Error('Error while merging files');
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


	return (
		<>
		{processing && (
			<div className="flex flex-col overlay">
				<Spinner label="Processing..." color="primary" />
				<p className="text-black text-center mt-4 italic font-extralight">Please wait while we merge your files, the new file will be downloaded automatically.</p>
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