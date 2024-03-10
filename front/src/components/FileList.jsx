import React from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@nextui-org/table";
import { DeleteIcon } from "./DeleteIcon";
import { useUtils } from  "../utils/useUtils";

export const FileList = ({ files, handleDeleteFile }) => {

	const { getFileSize, getFullSize } = useUtils();

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
						<TableCell className="text-left font-semibold">{getFullSize(files)}</TableCell>
						<TableCell></TableCell>
					</TableRow>
				</TableBody>
			</Table>
	);
};