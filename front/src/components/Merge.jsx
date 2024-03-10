import React from "react";
import { FileList } from "./FileList";
import { useFileHandlers } from "../utils/useFileHandlers";
import { useUtils } from "../utils/useUtils";

import { CrossIcon } from "./CrossIcon";
import { Spinner } from "@nextui-org/spinner";


export default function Merge() {

	const {
		files, setFiles,
		dragOver,
		inputKey,
		processing, setProcessing,
		error, setError,
		errorMessage, setErrorMessage,
		fileInputRef,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleFileSelect,
		handleDeleteFile,
		handleClick
	} = useFileHandlers();


	const {
		getRequestBody,
		checkRequestSize,
		getMergedBase64,
		automaticDownload
	} = useUtils();


	const handleMergeFiles = async () => { // Main function that calls the AWS Lambda function to merge the files and download the merged file
		setProcessing(true);
		try {
			const requestBody = await getRequestBody(files); // Get the request body to send to the AWS Lambda function
			checkRequestSize(requestBody); // Check if the request size is less than 10MB

			const mergedBase64 = await getMergedBase64(requestBody); // Call the AWS Lambda function to merge the files and get the merged file in base64 format
			automaticDownload(mergedBase64); // Download the merged file
			
			setFiles([]);
			setProcessing(false);

		} catch (error) {
			setError(true);
			setErrorMessage(error.message);
			console.error(error);
		}
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
						{files.length > 0 && <FileList files={files} handleDeleteFile={handleDeleteFile} />}
						<div className="flex justify-center mt-2">
							{files.length > 1 && <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleMergeFiles}>Merge files</button>}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}