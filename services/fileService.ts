// services/fileService.ts
import axios from 'axios';
import type { FileUploadResponse } from '@/types/admin';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-dev.elanroadtestrental.ca/v1';

const fileClient = axios.create({
  baseURL: `${API_BASE_URL}`,
  withCredentials: true,
});

fileClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed - 401 Unauthorized');
    }
    return Promise.reject(error);
  }
);

export const fileService = {
  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fileClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
};