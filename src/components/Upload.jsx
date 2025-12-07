// components/Upload.jsx
import React, { useState, useRef } from 'react';
import api from '../api';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function Upload({ onDone }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error' | 'info'
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const getFileIcon = (file) => {
    const type = file.type || '';
    if (type.startsWith('image/')) {
      return <PhotoIcon className="h-5 w-5 text-pink-500" />;
    }
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
    }
    if (type.startsWith('audio/')) {
      return <MusicalNoteIcon className="h-5 w-5 text-purple-500" />;
    }
    if (type.startsWith('video/')) {
      return <VideoCameraIcon className="h-5 w-5 text-red-500" />;
    }
    if (type.includes('zip') || type.includes('compressed')) {
      return <ArchiveBoxIcon className="h-5 w-5 text-yellow-500" />;
    }
    return <DocumentIcon className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check for duplicates
    const existingFilenames = files.map(f => f.name);
    const newFiles = selectedFiles.filter(file => !existingFilenames.includes(file.name));
    
    if (newFiles.length !== selectedFiles.length) {
      showMessage('Some files were already selected', 'error');
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  async function submit(e) {
    e.preventDefault();
    
    if (files.length === 0) {
      showMessage('Please select files to upload', 'error');
      return;
    }

    const fd = new FormData();
    files.forEach(file => fd.append('files', file));

    try {
      setUploading(true);
      showMessage('Uploading files...', 'info');
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          Object.keys(newProgress).forEach(key => {
            if (newProgress[key] < 90) {
              newProgress[key] += Math.random() * 10;
            }
          });
          return newProgress;
        });
      }, 300);

      await api.post('/files/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress({ overall: percentCompleted });
        }
      });

      clearInterval(progressInterval);
      setUploadProgress({ overall: 100 });
      
      showMessage(`${files.length} file(s) uploaded successfully!`, 'success');
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onDone) {
        setTimeout(() => onDone(), 500);
      }
    } catch (error) {
      showMessage(`Upload failed: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress({});
      }, 1000);
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  return (
    <div className="w-full">
      <div 
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gradient-to-b from-white to-gray-50 hover:border-indigo-400 transition-colors duration-200 cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
          <CloudArrowUpIcon className="h-6 w-6 text-indigo-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload files
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">
          Drag & drop files here or click to browse
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          Browse files
        </button>
        
        <p className="mt-2 text-xs text-gray-400">
          Supports images, documents, videos, audio, and archives
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({files.length})
            </h4>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800 flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Clear all
            </button>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                {uploadProgress[index] !== undefined && (
                  <div className="w-24 mr-4">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[index] || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      {Math.round(uploadProgress[index] || 0)}%
                    </p>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          
          {uploadProgress.overall !== undefined && uploading && (
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="mb-1 flex justify-between">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-medium text-gray-700">{uploadProgress.overall}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.overall}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Total: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
              </span>
              <button
                type="button"
                onClick={submit}
                disabled={uploading}
                className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    Upload {files.length} file{files.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-4 rounded-lg p-4 ${
          messageType === 'success' ? 'bg-green-50 border border-green-200' :
          messageType === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {messageType === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              ) : messageType === 'error' ? (
                <XCircleIcon className="h-5 w-5 text-red-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                messageType === 'success' ? 'text-green-800' :
                messageType === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}