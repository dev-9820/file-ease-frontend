import React, { useEffect, useState } from 'react';
import {
  UploadIcon,
  DownloadIcon,
  ShareIcon,
  TrashIcon,
  FolderIcon,
  ArchiveIcon,
  CloudIcon,
  SearchIcon,
  FilterIcon,
  ClockIcon,
  UserIcon,
  ChevronDownIcon,
  DockIcon,
  PlusIcon,
  ArrowUp01,
  ChartBarIcon,
  LogOutIcon,
  Music2Icon,
  PictureInPictureIcon,
  GroupIcon,
  CameraIcon,
  XIcon
} from 'lucide-react';
import api from '../api';
import Upload from './Upload';
import ShareModal from './ShareModal';
import AccessSharedFile from "./AccessSharedFile"
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function Dashboard() {
  const [own, setOwn] = useState([]);
  const [shared, setShared] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openShareFor, setOpenShareFor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 1048580000 }); // 1GB total
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

  const user = {
    name: localStorage.getItem('userName') || 'User',
    email: localStorage.getItem('userEmail') || 'user@example.com'
  };

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/files/list');
      setOwn(res.data.own || []);
      setShared(res.data.shared || []);
      
      // Calculate storage usage
      const totalSize = (res.data.own || []).reduce((sum, file) => sum + (file.size || 0), 0);
      setStorageUsage(prev => ({ ...prev, used: totalSize }));
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function download(file) {
    try {
      const res = await api.get(`/files/download/${file._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Download failed: ' + (e.response?.data?.error || e.message));
    }
  }

  async function deleteFile(file) {
    if (!confirm('Are you sure you want to delete this file?')) return;
    await api.delete(`/files/${file._id}`);
    load();
  }

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return <PictureInPictureIcon className="h-8 w-8 text-pink-500" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return <DockIcon className="h-8 w-8 text-blue-500" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
      return <Music2Icon className="h-8 w-8 text-purple-500" />;
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension)) {
      return <CameraIcon className="h-8 w-8 text-red-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <ArchiveIcon className="h-8 w-8 text-yellow-500" />;
    }
    return <DockIcon className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredOwnFiles = own.filter(file => {
    const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'images') return matchesSearch && file.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    if (filter === 'documents') return matchesSearch && file.filename.match(/\.(pdf|doc|docx|txt|rtf)$/i);
    if (filter === 'videos') return matchesSearch && file.filename.match(/\.(mp4|avi|mov|wmv|mkv)$/i);
    if (filter === 'audio') return matchesSearch && file.filename.match(/\.(mp3|wav|ogg|flac)$/i);
    return matchesSearch;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
  };

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleBulkDownload = async () => {
    for (const fileId of selectedFiles) {
      const file = own.find(f => f._id === fileId);
      if (file) await download(file);
    }
    setSelectedFiles([]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedFiles.length} selected file(s)?`)) return;
    for (const fileId of selectedFiles) {
      const file = own.find(f => f._id === fileId);
      if (file) await api.delete(`/files/${file._id}`);
    }
    load();
    setSelectedFiles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                  <CloudIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  File-Ease
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Storage Usage */}
              <div className="hidden md:block">
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(storageUsage.used / storageUsage.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatFileSize(storageUsage.used)} / {formatFileSize(storageUsage.total)}
                  </span>
                </div>
              </div>

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <UserIcon className="h-4 w-4 mr-3" />
                    Profile
                  </a>
                  <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <DockIcon className="h-4 w-4 mr-3" />
                    Account Settings
                  </a>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOutIcon className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Files</p>
                <p className="text-2xl font-bold text-gray-900">{own.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <FolderIcon className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <ArrowUp01 className="h-4 w-4 mr-1" />
                <span>Uploaded files</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shared Files</p>
                <p className="text-2xl font-bold text-gray-900">{shared.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <GroupIcon className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <ShareIcon className="h-4 w-4 mr-1" />
                <span>Files shared with you</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(storageUsage.used)}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <CloudIcon className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(storageUsage.used / storageUsage.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {((storageUsage.used / storageUsage.total) * 100).toFixed(1)}% of {formatFileSize(storageUsage.total)}
              </p>
            </div>
          </div>
        </div>

        

        {/* File Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors duration-200"
                  />
                </div>

                <div className="relative">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors duration-200"
                  >
                    <option value="all">All Files</option>
                    <option value="images">Images</option>
                    <option value="documents">Documents</option>
                    <option value="videos">Videos</option>
                    <option value="audio">Audio</option>
                  </select>
                  <FilterIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {/* Bulk Actions */}
                {selectedFiles.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{selectedFiles.length} selected</span>
                    <button
                      onClick={handleBulkDownload}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Download
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Upload Component */}
                
              </div>
            </div>
          </div>
          <Upload onDone={load} />

          {/* Files Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading files...</p>
              </div>
            ) : filteredOwnFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400">
                  <FolderIcon className="h-24 w-24" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No files</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchQuery ? 'No files match your search' : 'Get started by uploading a file'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredOwnFiles.map((file) => (
                  <div
                    key={file._id}
                    className={`group relative bg-white border rounded-xl p-4 hover:shadow-lg transition-all duration-200 ${
                      selectedFiles.includes(file._id) ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file._id)}
                        onChange={() => handleFileSelect(file._id)}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(file.filename)}
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size || 0)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {dayjs(file.uploadedAt).fromNow()}
                          </span>
                          {file.downloadCount > 0 && (
                            <span className="flex items-center">
                              <DownloadIcon className="h-3 w-3 mr-1" />
                              {file.downloadCount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => download(file)}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Download"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setOpenShareFor(file)}
                              className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors duration-200"
                              title="Share"
                            >
                              <ShareIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => deleteFile(file)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedFiles.length === filteredOwnFiles.length && filteredOwnFiles.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFiles(filteredOwnFiles.map(f => f._id));
                            } else {
                              setSelectedFiles([]);
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOwnFiles.map((file) => (
                      <tr key={file._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file._id)}
                            onChange={() => handleFileSelect(file._id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {getFileIcon(file.filename)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {file.filename}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(file.size || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dayjs(file.uploadedAt).format('MMM D, YYYY')}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => download(file)}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                            >
                              <DownloadIcon className="h-4 w-4 mr-1" />
                              Download
                            </button>
                            <button
                              onClick={() => setOpenShareFor(file)}
                              className="text-green-600 hover:text-green-900 inline-flex items-center"
                            >
                              <ShareIcon className="h-4 w-4 mr-1" />
                              Share
                            </button>
                            <button
                              onClick={() => deleteFile(file)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <AccessSharedFile />
        </div>

        {/* Shared Files Section */}
        {shared.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <GroupIcon className="h-6 w-6 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Shared with me</h2>
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {shared.length}
              </span>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shared by
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shared on
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shared.map((file) => (
                      <tr key={file._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getFileIcon(file.filename)}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {file.filename}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatFileSize(file.size || 0)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="h-6 w-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-semibold">
                                {file.owner?.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            {file.owner?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dayjs(file.sharedAt).format('MMM D, YYYY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => download(file)}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                          >
                            <DownloadIcon className="h-4 w-4 mr-1" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Share Modal */}
      {openShareFor && (
        <ShareModal
          file={openShareFor}
          onClose={() => setOpenShareFor(null)}
          onSuccess={() => {
            setOpenShareFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}