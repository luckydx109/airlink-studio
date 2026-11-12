import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FileTransferItem } from '@shared/types';

interface TransferContextType {
  activeTransfers: FileTransferItem[];
  transferHistory: FileTransferItem[];
  isTransferring: boolean;
  downloadFiles: (serial: string, remotePaths: string[], destinationDir?: string) => Promise<FileTransferItem[]>;
  uploadFiles: (serial: string, localPaths: string[], remoteDir?: string) => Promise<FileTransferItem[]>;
  selectDestinationFolder: () => Promise<string | null>;
  selectLocalFiles: () => Promise<string[]>;
  clearHistory: () => void;
  openLocalFile: (path: string) => void;
}

const TransferContext = createContext<TransferContextType | undefined>(undefined);

export const TransferProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTransfers, setActiveTransfers] = useState<FileTransferItem[]>([]);
  const [transferHistory, setTransferHistory] = useState<FileTransferItem[]>([]);

  useEffect(() => {
    if (!window.airlinkAPI) return;

    const unsubscribe = window.airlinkAPI.onTransferUpdate((updatedItem) => {
      // Update active list
      setActiveTransfers((prev) => {
        const index = prev.findIndex(t => t.id === updatedItem.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedItem;
          // If completed or failed, remove from active transfers after delay and put into history
          if (updatedItem.status === 'completed' || updatedItem.status === 'failed') {
            setTimeout(() => {
              setActiveTransfers(curr => curr.filter(t => t.id !== updatedItem.id));
              setTransferHistory(hist => [updatedItem, ...hist.filter(h => h.id !== updatedItem.id)].slice(0, 50));
            }, 800);
          }
          return next;
        } else {
          return [updatedItem, ...prev];
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const selectDestinationFolder = useCallback(async () => {
    return window.airlinkAPI.selectDestinationFolder();
  }, []);

  const selectLocalFiles = useCallback(async () => {
    return window.airlinkAPI.selectLocalFiles();
  }, []);

  const downloadFiles = useCallback(async (serial: string, remotePaths: string[], destinationDir?: string) => {
    let dest = destinationDir;
    if (!dest) {
      dest = await selectDestinationFolder() || '';
    }
    if (!dest) return [];

    return window.airlinkAPI.downloadFiles(serial, remotePaths, dest);
  }, [selectDestinationFolder]);

  const uploadFiles = useCallback(async (serial: string, localPaths: string[], remoteDir = '/sdcard/Download') => {
    let paths = localPaths;
    if (paths.length === 0) {
      paths = await selectLocalFiles();
    }
    if (paths.length === 0) return [];

    return window.airlinkAPI.uploadFiles(serial, paths, remoteDir);
  }, [selectLocalFiles]);

  const clearHistory = useCallback(() => {
    setTransferHistory([]);
  }, []);

  const openLocalFile = useCallback((localPath: string) => {
    window.airlinkAPI.openPath(localPath);
  }, []);

  const isTransferring = activeTransfers.some(t => t.status === 'transferring' || t.status === 'queued');

  return (
    <TransferContext.Provider
      value={{
        activeTransfers,
        transferHistory,
        isTransferring,
        downloadFiles,
        uploadFiles,
        selectDestinationFolder,
        selectLocalFiles,
        clearHistory,
        openLocalFile,
      }}
    >
      {children}
    </TransferContext.Provider>
  );
};

export const useTransfer = () => {
  const context = useContext(TransferContext);
  if (!context) {
    throw new Error('useTransfer must be used within a TransferProvider');
  }
  return context;
};
