// components/ShareModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import dayjs from 'dayjs';
import {
  XMarkIcon,
  UserPlusIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  QrCodeIcon,
  TrashIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

export default function ShareModal({ file, onClose, onSuccess }) {
  const [userEmail, setUserEmail] = useState('');
  const [userExpiry, setUserExpiry] = useState('86400');
  const [linkExpiry, setLinkExpiry] = useState('86400');
  const [link, setLink] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [generatedLinks, setGeneratedLinks] = useState([]);

  // Load existing shares
  useEffect(() => {
    if (file) {
      loadExistingShares();
    }
  }, [file]);

  const loadExistingShares = async () => {
    try {
      const res = await api.get(`/files/shares/${file._id}`);
      if (res.data) {
        setSharedUsers(res.data.users || []);
        setGeneratedLinks(res.data.links || []);
      }
    } catch (error) {
      console.error('Failed to load existing shares:', error);
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

  // Common expiry options for both user sharing and links
  const getExpiryOptions = [
    { label: '1 hour', value: 3600 },
    { label: '6 hours', value: 21600 },
    { label: '24 hours', value: 86400 },
    { label: '7 days', value: 604800 },
    { label: '30 days', value: 2592000 },
    { label: 'Never expires', value: 0 }
  ];

  
  async function shareWithUser() {
    if (!userEmail.trim()) {
      showMessage('Please enter an email address', 'error');
      return;
    }

    setLoading(true);

    try {
      // Look up user by email
      let userId;
      try {
        const res = await api.post('/users/find-by-email', { email: userEmail });
        userId = res.data._id;
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message;
        showMessage(`User lookup failed: ${msg}`, 'error');
        return;
      }

      // Share the file with that user using dynamic expiry
      try {
        await api.post(`/files/share/users/${file._id}`, {
          userIds: [userId],
          expiresInSeconds: Number(userExpiry) 
        });
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message;
        showMessage(`Sharing failed: ${msg}`, 'error');
        return;
      }

      // Success
      showMessage(`File shared with ${userEmail}`, 'success');
      setUserEmail('');
      if (onSuccess) onSuccess();
      loadExistingShares();

    } finally {
      setLoading(false);
    }
  }

  async function createLink() {
    setLoading(true);
    try {
      const res = await api.post(`/files/share/link/${file._id}`, { 
        expiresInSeconds: Number(linkExpiry)
      });
      
      const newLink = {
        url: `${window.location.origin}/shared/${res.data.link}`,
        expiresAt: res.data.expiresAt,
        token: res.data.link,
        createdAt: new Date().toISOString()
      };
      
      setGeneratedLinks(prev => [newLink, ...prev]);
      showMessage('Shareable link created successfully!', 'success');
      if (onSuccess) onSuccess();
    } catch (error) {
      showMessage(`Failed to create link: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function revokeLink(token) {
    if (!confirm('Are you sure you want to revoke this link?')) return;
    
    try {
      await api.post(`/files/revoke/link/${token}`);
      setGeneratedLinks(prev => prev.filter(l => l.token !== token));
      showMessage('Link revoked successfully', 'success');
      if (onSuccess) onSuccess();
    } catch (error) {
      showMessage(`Failed to revoke link: ${error.response?.data?.error || error.message}`, 'error');
    }
  }

  async function revokeUserShare(userId) {
    if (!confirm('Are you sure you want to revoke access for this user?')) return;

    try {
      await api.post(`/files/revoke/user/${file._id}`, { userId });
      setSharedUsers(prev => prev.filter(u => u._id !== userId));
      showMessage('Access revoked successfully', 'success');
      if (onSuccess) onSuccess();
    } catch (error) {
      showMessage(`Failed to revoke access: ${error.response?.data?.error || error.message}`, 'error');
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showMessage('Copied to clipboard!', 'success');
    }).catch(err => {
      showMessage('Failed to copy: ' + err, 'error');
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <UserGroupIcon className="h-6 w-6 mr-2 text-indigo-600" />
              Share "{file.filename}"
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Share this file with other users or create a shareable link
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Message Display */}
            {message && (
              <div className={`mt-6 rounded-lg mx-5 p-4 ${
                messageType === 'success' ? 'bg-green-50 border border-green-200' :
                messageType === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {messageType === 'success' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    ) : messageType === 'error' ? (
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                    ) : (
                      <ExclamationCircleIcon className="h-5 w-5 text-blue-400" />
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

          <div className="p-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                      <UserPlusIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Share with User</h3>
                      <p className="text-sm text-gray-600">Invite specific users by email</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter email address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors duration-200"
                        />
                      </div>
                    </div>

                    {/* NEW: User Sharing Expiry Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access expiration
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {getExpiryOptions.map((option) => (
                          <button
                            key={`user-${option.value}`}
                            type="button"
                            onClick={() => setUserExpiry(option.value.toString())}
                            className={`px-3 py-2 text-sm rounded-lg border transition-colors duration-200 ${
                              userExpiry === option.value.toString()
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={userExpiry}
                        onChange={(e) => setUserExpiry(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors duration-200"
                        min="0"
                      />
                    </div>

                    <button
                      onClick={shareWithUser}
                      disabled={loading || !userEmail.trim()}
                      className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sharing...
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="h-4 w-4 mr-2" />
                          Share with User
                        </>
                      )}
                    </button>

                    <div className="flex items-center text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                      <ShieldCheckIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Users need a File-Ease account to access shared files</span>
                    </div>
                  </div>

                  {/* Shared Users List */}
                  {sharedUsers.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Currently shared with ({sharedUsers.length})
                      </h4>
                      <div className="space-y-2">
                        {sharedUsers.map((user) => {
                          const expiresAt = dayjs(user.expiresAt);
                          const now = dayjs();
                          const isExpired = expiresAt.isBefore(now);
                          const timeRemaining = expiresAt.diff(now, 'minute');
                          
                          const getTimeRemainingText = () => {
                            if (isExpired) return 'Expired';
                            if (timeRemaining < 60) return `${timeRemaining}m`;
                            if (timeRemaining < 1440) return `${Math.floor(timeRemaining / 60)}h`;
                            return `${Math.floor(timeRemaining / 1440)}d`;
                          };

                          const getStatusColor = () => {
                            if (isExpired) return 'text-red-600 bg-red-50';
                            if (timeRemaining < 1440) return 'text-yellow-600 bg-yellow-50';
                            return 'text-green-600 bg-green-50';
                          };

                          return (
                            <div key={user._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200">
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="h-8 w-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                  <span className="text-white text-xs font-semibold">
                                    {user.grantee?.name?.charAt(0) || user.grantee?.email?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {user.grantee?.name || 'Unknown User'}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {user.grantee?.email}
                                      </p>
                                    </div>
                                    <div className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()} flex items-center`}>
                                      <ClockIcon className="h-3 w-3 mr-1" />
                                      <span className="font-semibold">{getTimeRemainingText()}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Expiration date */}
                                  <div className="mt-1">
                                    <p className="text-xs text-gray-500">
                                      {isExpired ? 'Expired on ' : 'Expires on '}
                                      {expiresAt.format('MMM D, YYYY h:mm A')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => revokeUserShare(user.grantee._id)}
                                className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 flex-shrink-0"
                                title="Revoke access"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Create Shareable Link Section */}
              <div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                      <LinkIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Shareable Link</h3>
                      <p className="text-sm text-gray-600">Create a link anyone can use to access this file</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link expiration
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {getExpiryOptions.map((option) => (
                          <button
                            key={`link-${option.value}`}
                            type="button"
                            onClick={() => setLinkExpiry(option.value.toString())}
                            className={`px-3 py-2 text-sm rounded-lg border transition-colors duration-200 ${
                              linkExpiry === option.value.toString()
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={linkExpiry}
                        onChange={(e) => setLinkExpiry(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors duration-200"
                        min="0"
                      />
                    </div>

                    <button
                      onClick={createLink}
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Link...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Generate Shareable Link
                        </>
                      )}
                    </button>

                    <div className="flex items-center text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                      <ShieldCheckIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Links can be accessed by any <b>User</b> with the URL</span>
                    </div>
                  </div>

                  {/* Generated Links List */}
                  {generatedLinks.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Active Links ({generatedLinks.length})
                      </h4>
                      <div className="space-y-3">
                        {generatedLinks.map((generatedLink, index) => (
                          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <LinkIcon className="h-4 w-4 text-green-500 mr-2" />
                                <span className="text-sm font-medium text-gray-900">Share Link #{index + 1}</span>
                              </div>
                              <button
                                onClick={() => revokeLink(generatedLink.token)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Revoke link"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="mb-3">
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-700 truncate mr-2">{generatedLink.token}</p>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => copyToClipboard(generatedLink.token)}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                    title="Copy link"
                                  >
                                    <ClipboardDocumentIcon className="h-4 w-4" />
                                  </button>
                                  
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                <span>Created: {dayjs(generatedLink.createdAt).format('MMM D, YYYY')}</span>
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                <span>
                                  {generatedLink.expiresAt
                                    ? `Expires: ${dayjs(generatedLink.expiresAt).format('MMM D, HH:mm')}`
                                    : 'Never expires'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* File Info Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  <span>All shares are encrypted and secure</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    File ID: {file._id?.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}