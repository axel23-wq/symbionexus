export interface FileUploadResult {
  url: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

export interface IFileStorageService {
  uploadFile(fileBuffer: Buffer, filename: string, mimeType: string): Promise<FileUploadResult>;
  deleteFile(url: string): Promise<void>;
}
