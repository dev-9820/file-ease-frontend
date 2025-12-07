// components/AccessSharedFile.jsx
import React, { useState } from 'react';
import api from '../api';
import {
  LinkIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  PhotoIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import { ShieldCheckIcon } from 'lucide-react';

export default function AccessSharedFile() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  const getFileIcon = (filename, contentType) => {
    const type = contentType || '';
    const extension = filename.split('.').pop().toLowerCase();
    
    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <PhotoIcon className="h-10 w-10 text-pink-500" />;
    }
    if (type.includes('pdf') || type.includes('document') || type.includes('text') || 
        ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return <DocumentTextIcon className="h-10 w-10 text-blue-500" />;
    }
    if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
      return <MusicalNoteIcon className="h-10 w-10 text-purple-500" />;
    }
    if (type.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension)) {
      return <VideoCameraIcon className="h-10 w-10 text-red-500" />;
    }
    if (type.includes('zip') || type.includes('compressed') || 
        ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <ArchiveBoxIcon className="h-10 w-10 text-yellow-500" />;
    }
    return <DocumentIcon className="h-10 w-10 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text.trim());
    } catch (err) {
      setError('Unable to paste from clipboard. Please paste manually.');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Please enter a share token');
      return;
    }

    setLoading(true);
    setError('');
    setFileInfo(null);

    try {
      // get file info without downloading
      const res = await api.get(`/files/access-info/${token}`);
      
      if (res.data) {
        setFileInfo(res.data);
      } else {
        setFileInfo({
          filename: 'Shared File',
          exists: true
        });
      }
    } catch (error) {
      // If info endpoint fails, try to download directly
      await handleDownload();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
  if (!token.trim()) {
    setError("Please enter a share token");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const response = await api.get(`/files/access-link/${token}`, {
      responseType: "arraybuffer", // IMPORTANT for streamed data
    });

    // Extract filename from headers
    const disposition = response.headers["content-disposition"];
    let filename = "downloaded-file";

    if (disposition) {
      const match = disposition.match(/filename="(.+?)"/);
      if (match) filename = match[1];
    }

    // Create blob from arraybuffer
    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    // Store basic file info
    if (!fileInfo) {
      setFileInfo({
        filename,
        size: response.data.byteLength,
        contentType: response.headers["content-type"],
        downloaded: true,
      });
    }
  } catch (error) {
    setError(
      error.response?.data?.error ||
        "Failed to access this file. The link may be invalid or expired."
    );
    setFileInfo(null);
  } finally {
    setLoading(false);
  }
};

  const handleClear = () => {
    setToken('');
    setFileInfo(null);
    setError('');
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="h-12 w-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mr-4">
          <LinkIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Access Shared Files</h2>
          <p className="text-sm text-gray-600">Enter a share token to access files shared with you</p>
        </div>
      </div>

      {/* Token Input Section */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              Share Token
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste share token here (e.g., abc123def456)"
                className="pl-10 pr-24 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors duration-200"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors duration-200"
                >
                  <ClipboardDocumentIcon className="h-4 w-4 mr-1.5" />
                  Paste
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Tokens look like: abc123def456, xyz789ghi012, etc. Usually shared via link or email.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Check & Access
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* File Info Display */}
      {fileInfo && (
        <div className="border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">File Ready for Download</h3>
            <div className="flex items-center space-x-2">
              {copied ? (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Copied!
                </span>
              ) : (
                <button
                  onClick={handleCopyToken}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
                >
                  <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                  Copy Token
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {getFileIcon(fileInfo.filename || 'file', fileInfo.contentType)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {fileInfo.filename || 'Shared File'}
                </h4>
                {fileInfo.size && (
                  <p className="text-sm text-gray-600 mt-1">
                    {formatFileSize(fileInfo.size)}
                    {fileInfo.contentType && (
                      <span className="ml-2 text-gray-500">
                        • {fileInfo.contentType.split('/')[1]?.toUpperCase() || 'File'}
                      </span>
                    )}
                  </p>
                )}
                
                {/* File Metadata */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fileInfo.owner && (
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Shared by: {fileInfo.owner.name || 'Unknown'}</span>
                    </div>
                  )}
                  
                  {fileInfo.createdAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Shared: {dayjs(fileInfo.createdAt).format('MMM D, YYYY')}</span>
                    </div>
                  )}
                  
                  {fileInfo.expiresAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Expires: {dayjs(fileInfo.expiresAt).format('MMM D, YYYY h:mm A')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Button */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">
                    {fileInfo.downloaded ? 'File downloaded successfully!' : 'Ready to download'}
                  </p>
                  
                </div>
                
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download File
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">How to use this tool</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-blue-600 text-xs font-bold">1</span>
              </div>
              <span className="text-sm font-medium text-blue-900">Get Token</span>
            </div>
            <p className="text-xs text-blue-700">
              Copy the share token from the shared link or email you received
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-green-600 text-xs font-bold">2</span>
              </div>
              <span className="text-sm font-medium text-green-900">Paste Token</span>
            </div>
            <p className="text-xs text-green-700">
              Paste the token above and click "Check & Access" to verify
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-purple-600 text-xs font-bold">3</span>
              </div>
              <span className="text-sm font-medium text-purple-900">Download</span>
            </div>
            <p className="text-xs text-purple-700">
              Preview file details and download securely to your device
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}