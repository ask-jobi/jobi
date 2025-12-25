"use client"
import React from 'react';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem, FileUploadItemDelete, FileUploadItemMetadata, FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger
} from "@/components/ui/file-upload";
import {Upload, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";

type ResumeUploadProps = {
  onSelectFile: (file: File) => void,
  file: File | undefined
}

function ResumeUpload(props: ResumeUploadProps) {
  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
    });
  }, []);

  const handleSelectFile = (files: File[]) => {
    props.onSelectFile(files[0])
  }

  return (
    <FileUpload
      maxSize={5 * 1024 * 1024}
      className="w-full"
      value={props.file ? [props.file]: []}
      onValueChange={handleSelectFile}
      onFileReject={onFileReject}
    >
      <FileUploadDropzone>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center justify-center rounded-full border p-2.5">
            <Upload className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">Drag & drop files here</p>
          <p className="text-muted-foreground text-xs">
            Or click to browse one file, up to 5MB
          </p>
        </div>
        <FileUploadTrigger asChild>
          <Button variant="outline" size="sm" className="mt-2 w-fit">
            Browse files
          </Button>
        </FileUploadTrigger>
      </FileUploadDropzone>
      <FileUploadList>
        {props.file &&
          <FileUploadItem value={props.file}>
            <FileUploadItemPreview />
            <FileUploadItemMetadata />
            <FileUploadItemDelete asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <X />
              </Button>
            </FileUploadItemDelete>
          </FileUploadItem>
        }
      </FileUploadList>
    </FileUpload>
  );
}

export default ResumeUpload;
