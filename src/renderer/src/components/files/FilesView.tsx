import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { useTransfer } from '../../context/TransferContext';
import { AndroidFile } from '@shared/types';
import { StorageOverview } from './StorageOverview';
import { FilePreviewModal } from './FilePreviewModal';
import { TransferDrawer } from './TransferDrawer';
import { TransferHistoryModal } from './TransferHistoryModal';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import {
  Folder,
  FolderOpen,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Package,
  Archive,
  Download,
  Upload,
  Trash2,
  Search,
  ArrowUp,
  RefreshCw,
  Plus,
  CheckSquare,
  Square,
  Eye,
  LayoutGrid,
  List,
  HardDrive,
  Camera,
  Film,
  FileSpreadsheet,
  ArrowUpDown,
  History,
  Smartphone,
} from 'lucide-react';

export const FilesView: React.FC = () => {
  const { selectedDevice } = useDevice();
  const { downloadFiles, uploadFiles, isTransferring } = useTransfer();

  const [currentPath, setCurrentPath] = useState('/sdcard');
  const [files, setFiles] = useState<AndroidFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<AndroidFile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTransferDrawerOpen, setIsTransferDrawerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load directory files
  const loadDirectory = useCallback(async (dirPath: string) => {
    if (!selectedDevice || !window.airlinkAPI) return;
    setIsLoading(true);
    setSelectedPaths(new Set());
    try {
      const list = await window.airlinkAPI.listFiles(selectedDevice.serial, dirPath);
      setFiles(list);
      setCurrentPath(dirPath);
    } catch (e) {
      console.error('Failed to list files:', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (selectedDevice) {
      loadDirectory('/sdcard');
    }
  }, [selectedDevice, loadDirectory]);

  // Quick Jump destinations
  const quickJumps = [
    { label: 'Storage Root', path: '/sdcard', icon: <HardDrive className="w-3.5 h-3.5" /> },
    { label: 'Camera / DCIM', path: '/sdcard/DCIM', icon: <Camera className="w-3.5 h-3.5" /> },
    { label: 'Pictures', path: '/sdcard/Pictures', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { label: 'Downloads', path: '/sdcard/Download', icon: <Download className="w-3.5 h-3.5" /> },
    { label: 'Documents', path: '/sdcard/Documents', icon: <FileText className="w-3.5 h-3.5" /> },
    { label: 'Movies', path: '/sdcard/Movies', icon: <Film className="w-3.5 h-3.5" /> },
    { label: 'Music', path: '/sdcard/Music', icon: <Music className="w-3.5 h-3.5" /> },
  ];

  // Up directory
  const handleGoUp = () => {
    if (currentPath === '/' || currentPath === '/sdcard') return;
    const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/sdcard';
    loadDirectory(parent);
  };

  // Double click file/folder
  const handleItemClick = (file: AndroidFile) => {
    if (file.isDirectory) {
      loadDirectory(file.path);
    } else {
      setPreviewFile(file);
    }
  };

  // Selection toggle
  const toggleSelect = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedPaths);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setSelectedPaths(next);
  };

  const handleSelectAll = () => {
    if (selectedPaths.size === filteredFiles.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(filteredFiles.map((f) => f.path)));
    }
  };

  // Batch Download
  const handleBatchDownload = async () => {
    if (!selectedDevice || selectedPaths.size === 0) return;
    setIsTransferDrawerOpen(true);
    await downloadFiles(selectedDevice.serial, Array.from(selectedPaths));
    setSelectedPaths(new Set());
  };

  // Single Download
  const handleDownloadSingle = async (file: AndroidFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedDevice) return;
    setIsTransferDrawerOpen(true);
    await downloadFiles(selectedDevice.serial, [file.path]);
  };

  // Upload Files (Windows -> Phone)
  const handleUploadFiles = async () => {
    if (!selectedDevice) return;
    setIsTransferDrawerOpen(true);
    await uploadFiles(selectedDevice.serial, [], currentPath);
    await loadDirectory(currentPath);
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (!selectedDevice || selectedPaths.size === 0) return;
    const confirm = window.confirm(`Delete ${selectedPaths.size} selected item(s) from phone?`);
    if (!confirm) return;

    for (const p of Array.from(selectedPaths)) {
      await window.airlinkAPI.deleteItem(selectedDevice.serial, p);
    }
    setSelectedPaths(new Set());
    await loadDirectory(currentPath);
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!selectedDevice) return;
    const name = window.prompt('Enter new folder name:');
    if (!name || !name.trim()) return;
    const newDir = `${currentPath}/${name.trim()}`;
    await window.airlinkAPI.createDirectory(selectedDevice.serial, newDir);
    await loadDirectory(currentPath);
  };

  // Filter & Sort
  const filteredFiles = useMemo(() => {
    return files
      .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        // Folders always first
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;

        let res = 0;
        if (sortBy === 'name') res = a.name.localeCompare(b.name);
        else if (sortBy === 'size') res = a.size - b.size;
        else if (sortBy === 'date') res = a.modified.localeCompare(b.modified);

        return sortOrder === 'asc' ? res : -res;
      });
  }, [files, searchQuery, sortBy, sortOrder]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!selectedDevice) return;

    const droppedFiles: string[] = [];
    if (e.dataTransfer.files) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const item = e.dataTransfer.files[i];
        if (item.path) {
          droppedFiles.push(item.path);
        }
      }
    }

    if (droppedFiles.length > 0) {
      setIsTransferDrawerOpen(true);
      await uploadFiles(selectedDevice.serial, droppedFiles, currentPath);
      await loadDirectory(currentPath);
    }
  };

  const getCategoryIcon = (file: AndroidFile) => {
    if (file.isDirectory) return <Folder className="w-5 h-5 text-amber-400 fill-amber-400/20" />;
    switch (file.category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-cyan-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'apk':
        return <Package className="w-5 h-5 text-green-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-purple-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (!selectedDevice) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div className="space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-slate-500">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No Device Connected</h3>
          <p className="text-xs text-slate-400">
            Please connect your Android phone in the Dashboard to browse and transfer files.
          </p>
        </div>
      </div>
    );
  }

  // Parse path breadcrumbs
  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative h-full flex flex-col p-6 space-y-4 overflow-hidden"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-brand-600/30 backdrop-blur-md border-4 border-dashed border-brand-400 rounded-3xl flex flex-col items-center justify-center text-white pointer-events-none">
          <Upload className="w-16 h-16 text-brand-300 animate-bounce mb-3" />
          <h3 className="text-lg font-bold">Drop files here</h3>
          <p className="text-xs text-brand-200 mt-1">
            Files will be transferred directly to Android: <span className="font-mono">{currentPath}</span>
          </p>
        </div>
      )}

      {/* Top Storage Bar */}
      <StorageOverview serial={selectedDevice.serial} />

      {/* Quick Jump Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {quickJumps.map((jump) => (
          <button
            key={jump.path}
            onClick={() => loadDirectory(jump.path)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              currentPath === jump.path || currentPath.startsWith(jump.path + '/')
                ? 'bg-brand-500/15 border-brand-400/30 text-brand-300'
                : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {jump.icon}
            <span>{jump.label}</span>
          </button>
        ))}
      </div>

      {/* Navigation & Actions Header */}
      <GlassCard className="p-3 bg-white/[0.03] border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300 truncate max-w-md">
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={handleGoUp}
            disabled={currentPath === '/sdcard' || currentPath === '/'}
            className="h-7 w-7 text-slate-400 hover:text-white"
            title="Go up one folder"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </GlassButton>

          <button
            onClick={() => loadDirectory('/sdcard')}
            className="hover:text-brand-300 transition-colors font-semibold"
          >
            sdcard
          </button>

          {pathParts.slice(1).map((part, index) => {
            const subPath = '/' + pathParts.slice(0, index + 2).join('/');
            return (
              <React.Fragment key={subPath}>
                <span className="text-slate-600">/</span>
                <button
                  onClick={() => loadDirectory(subPath)}
                  className="hover:text-brand-300 transition-colors truncate max-w-[120px]"
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {selectedPaths.size > 0 && (
            <>
              <GlassButton
                variant="primary"
                size="sm"
                onClick={handleBatchDownload}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download ({selectedPaths.size})
              </GlassButton>
              <GlassButton
                variant="danger"
                size="sm"
                onClick={handleBatchDelete}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete ({selectedPaths.size})
              </GlassButton>
            </>
          )}

          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleCreateFolder}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Folder
          </GlassButton>

          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleUploadFiles}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Upload to Phone
          </GlassButton>

          <GlassButton
            variant="ghost"
            size="icon"
            onClick={() => loadDirectory(currentPath)}
            className="h-8 w-8 text-slate-400 hover:text-white"
            title="Refresh current folder"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </GlassButton>

          {/* Transfers Drawer trigger */}
          <GlassButton
            variant="glass"
            size="sm"
            onClick={() => setIsTransferDrawerOpen(!isTransferDrawerOpen)}
            className="text-xs"
          >
            Transfers {isTransferring && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-1" />}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Search & Sort Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-xs text-slate-400 hover:text-white"
          >
            {selectedPaths.size > 0 && selectedPaths.size === filteredFiles.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>Select All</span>
          </button>

          <span className="text-xs text-slate-500">
            {filteredFiles.length} item{filteredFiles.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative w-56">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-400"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {/* View mode */}
          <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* File Explorer Content (Grid or List) */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-400" />
            <span className="text-xs">Loading Android storage...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <FolderOpen className="w-12 h-12" />
            <span className="text-xs">This folder is empty</span>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredFiles.map((file) => {
              const isSelected = selectedPaths.has(file.path);
              return (
                <div
                  key={file.path}
                  onDoubleClick={() => handleItemClick(file)}
                  className={`relative p-3 rounded-2xl border transition-all cursor-pointer group flex flex-col items-center text-center justify-between ${
                    isSelected
                      ? 'bg-brand-500/15 border-brand-400/40'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  {/* Select Checkbox */}
                  <button
                    onClick={(e) => toggleSelect(file.path, e)}
                    className="absolute top-2 left-2 p-1 text-slate-500 hover:text-white"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>

                  {/* Icon */}
                  <div className="my-3">{getCategoryIcon(file)}</div>

                  {/* File name & size */}
                  <div className="w-full">
                    <span className="text-xs font-semibold text-white block truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                      {file.isDirectory ? 'Folder' : formatSize(file.size)}
                    </span>
                  </div>

                  {/* Hover Quick Actions */}
                  {!file.isDirectory && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-1 rounded bg-black/40 hover:bg-brand-500/30 text-slate-300 hover:text-white"
                        title="Preview"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDownloadSingle(file, e)}
                        className="p-1 rounded bg-black/40 hover:bg-brand-500/30 text-slate-300 hover:text-white"
                        title="Download to Windows"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {filteredFiles.map((file) => {
              const isSelected = selectedPaths.has(file.path);
              return (
                <div
                  key={file.path}
                  onDoubleClick={() => handleItemClick(file)}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-brand-500/15 border-brand-400/40 text-white'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.04] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <button onClick={(e) => toggleSelect(file.path, e)}>
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                    <div className="shrink-0">{getCategoryIcon(file)}</div>
                    <span className="truncate font-medium text-white max-w-sm">{file.name}</span>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 font-mono text-[11px] text-slate-400">
                    <span>{file.isDirectory ? '--' : formatSize(file.size)}</span>
                    <span className="hidden sm:inline">{file.modified}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!file.isDirectory && (
                        <>
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDownloadSingle(file, e)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Transfers Drawer */}
      <TransferDrawer
        isOpen={isTransferDrawerOpen}
        onClose={() => setIsTransferDrawerOpen(false)}
        onOpenHistory={() => {
          setIsTransferDrawerOpen(false);
          setIsHistoryOpen(true);
        }}
      />

      {/* History Modal */}
      <TransferHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        serial={selectedDevice.serial}
        onDownload={(f) => handleDownloadSingle(f)}
      />
    </div>
  );
};
