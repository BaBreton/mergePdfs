import { useState, useCallback, useRef } from 'react';


export const useFileHandlers = () => {

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


	return {
		files,
		dragOver,
		inputKey,
		processing,
		error,
		errorMessage,
		fileInputRef,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleFileSelect,
		handleDeleteFile,
		handleClick,
		setFiles,
		setProcessing,
		setError,
		setErrorMessage
	}
	
};