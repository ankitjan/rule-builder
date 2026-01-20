import React, { useState, useEffect, useRef } from 'react';
import { FolderTreeItem, RuleGroup } from '../../types';
import {
  getSavedRulesMetadata,
  getSavedRule,
  saveRule,
  deleteSavedRule,
  searchSavedRules,
  exportSavedRules,
  importSavedRules,
  getStorageInfo,
  buildFolderTree,
  createFolder,
  deleteFolder,
  getSavedFolders
} from '../../utils/savedRulesUtils';
import './SavedRulesManager.css';

export interface SavedRulesManagerProps {
  currentRule: RuleGroup;
  onLoadRule: (rule: RuleGroup) => void;
  onClose: () => void;
  storageKey?: string;
}

const SavedRulesManager: React.FC<SavedRulesManagerProps> = ({
  currentRule,
  onLoadRule,
  onClose,
  storageKey
}) => {
  const [folderTree, setFolderTree] = useState<FolderTreeItem[]>([]);
  const [currentFolderId] = useState<string | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    tags: '',
    folderId: undefined as string | undefined
  });
  const [showCreateFolderInSave, setShowCreateFolderInSave] = useState(false);
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    color: '#007bff',
    parentId: undefined as string | undefined
  });
  const [storageInfo, setStorageInfo] = useState({ ruleCount: 0, folderCount: 0, storageSize: 0 });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
    updateStorageInfo();
  }, [storageKey]);

  const loadData = () => {
    const tree = buildFolderTree(storageKey, getFoldersStorageKey());
    setFolderTree(tree);
  };

  const updateStorageInfo = () => {
    const info = getStorageInfo(storageKey, getFoldersStorageKey());
    setStorageInfo(info);
  };

  const getFoldersStorageKey = () => {
    return storageKey ? `${storageKey}-folders` : undefined;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setViewMode('list');
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleItemSelect = (itemId: string, isMultiSelect: boolean = false) => {
    const newSelected = new Set(selectedItems);
    
    if (isMultiSelect) {
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
    } else {
      newSelected.clear();
      newSelected.add(itemId);
    }
    
    setSelectedItems(newSelected);
  };

  const handleSaveRule = () => {
    if (!saveForm.name.trim()) {
      alert('Please enter a name for the rule');
      return;
    }

    const tags = saveForm.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
      saveRule(
        currentRule,
        saveForm.name.trim(),
        saveForm.description.trim() || undefined,
        tags.length > 0 ? tags : undefined,
        saveForm.folderId,
        storageKey
      );

      setSaveForm({ name: '', description: '', tags: '', folderId: undefined });
      setShowSaveDialog(false);
      loadData();
      updateStorageInfo();
    } catch (error) {
      alert(`Failed to save rule: ${error}`);
    }
  };

  const handleCreateFolder = () => {
    if (!folderForm.name.trim()) {
      alert('Please enter a name for the folder');
      return;
    }

    try {
      createFolder(
        folderForm.name.trim(),
        folderForm.description.trim() || undefined,
        folderForm.parentId, // Use parentId from form instead of currentFolderId
        folderForm.color,
        getFoldersStorageKey()
      );

      setFolderForm({ name: '', description: '', color: '#007bff', parentId: undefined });
      setShowCreateFolderDialog(false);
      loadData();
      updateStorageInfo();
    } catch (error) {
      alert(`Failed to create folder: ${error}`);
    }
  };

  const handleLoadRule = (ruleId: string) => {
    const savedRule = getSavedRule(ruleId, storageKey);
    if (savedRule) {
      onLoadRule(savedRule.rule);
      onClose();
    }
  };

  const handleDeleteItems = () => {
    if (selectedItems.size === 0) return;

    const itemsToDelete = Array.from(selectedItems);
    const confirmMessage = `Are you sure you want to delete ${itemsToDelete.length} item(s)?`;
    
    if (!confirm(confirmMessage)) return;

    itemsToDelete.forEach(itemId => {
      // Try to delete as rule first, then as folder
      if (!deleteSavedRule(itemId, storageKey)) {
        deleteFolder(itemId, true, storageKey, getFoldersStorageKey());
      }
    });

    setSelectedItems(new Set());
    loadData();
    updateStorageInfo();
  };

  const handleExportRules = () => {
    exportSavedRules(storageKey, getFoldersStorageKey());
  };

  const handleImportRules = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importSavedRules(file, storageKey, getFoldersStorageKey());
      
      let message = `Import completed:\n- Imported: ${result.imported} items\n- Skipped: ${result.skipped} items`;
      
      if (result.errors.length > 0) {
        message += `\n\nErrors:\n${result.errors.slice(0, 5).join('\n')}`;
        if (result.errors.length > 5) {
          message += `\n... and ${result.errors.length - 5} more errors`;
        }
      }
      
      alert(message);
      loadData();
      updateStorageInfo();
    } catch (error) {
      alert(`Import failed: ${error}`);
    }

    event.target.value = '';
  };

  const renderTreeItem = (item: FolderTreeItem, level: number = 0): React.ReactNode => {
    const isSelected = selectedItems.has(item.id);
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="file-explorer__item-container">
        <div
          className={`file-explorer__item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={(e) => handleItemSelect(item.id, e.ctrlKey || e.metaKey)}
          onDoubleClick={() => {
            if (item.type === 'rule') {
              handleLoadRule(item.id);
            } else {
              toggleFolder(item.id);
            }
          }}
        >
          {item.type === 'folder' && (
            <button
              className="file-explorer__expand-button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.id);
              }}
            >
              {hasChildren ? (isExpanded ? '▼' : '▶') : '▷'}
            </button>
          )}
          
          <div className="file-explorer__icon">
            {item.type === 'folder' ? '📁' : '📄'}
          </div>
          
          <span className="file-explorer__name">{item.name}</span>
          
          {item.type === 'rule' && (
            <div className="file-explorer__actions">
              <button
                className="file-explorer__action-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadRule(item.id);
                }}
                title="Load rule"
              >
                📂
              </button>
            </div>
          )}
        </div>
        
        {item.type === 'folder' && isExpanded && hasChildren && (
          <div className="file-explorer__children">
            {item.children!.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => {
    const rules = searchQuery 
      ? searchSavedRules(searchQuery, storageKey)
      : getSavedRulesMetadata(storageKey);

    return (
      <div className="file-explorer__list">
        {rules.map(rule => (
          <div
            key={rule.id}
            className={`file-explorer__list-item ${selectedItems.has(rule.id) ? 'selected' : ''}`}
            onClick={(e) => handleItemSelect(rule.id, e.ctrlKey || e.metaKey)}
            onDoubleClick={() => handleLoadRule(rule.id)}
          >
            <div className="file-explorer__list-icon">📄</div>
            <div className="file-explorer__list-content">
              <div className="file-explorer__list-name">{rule.name}</div>
              {rule.description && (
                <div className="file-explorer__list-description">{rule.description}</div>
              )}
              <div className="file-explorer__list-meta">
                {rule.ruleCount} rules, {rule.groupCount} groups • {rule.updatedAt.toLocaleDateString()}
              </div>
            </div>
            <div className="file-explorer__list-actions">
              <button
                className="file-explorer__action-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadRule(rule.id);
                }}
                title="Load rule"
              >
                📂
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper function to build folder options for dropdown
  const buildFolderOptions = () => {
    const folders = getSavedFolders(getFoldersStorageKey());
    const options: Array<{ value: string | undefined; label: string; level: number }> = [
      { value: undefined, label: '📁 Root Folder', level: 0 }
    ];

    // Create a map for quick lookup
    const folderMap = new Map(folders.map(f => [f.id, f]));
    
    // Build hierarchy
    const addFolderToOptions = (folderId: string, level: number = 0) => {
      const folder = folderMap.get(folderId);
      if (!folder) return;
      
      const indent = '  '.repeat(level);
      options.push({
        value: folder.id,
        label: `${indent}📁 ${folder.name}`,
        level: level + 1
      });
      
      // Add child folders
      const children = folders.filter(f => f.parentId === folderId);
      children.forEach(child => addFolderToOptions(child.id, level + 1));
    };

    // Add root level folders first
    const rootFolders = folders.filter(f => !f.parentId);
    rootFolders.forEach(folder => addFolderToOptions(folder.id));

    return options;
  };

  // Handle creating folder from save dialog
  const handleCreateFolderInSave = () => {
    if (!folderForm.name.trim()) {
      alert('Please enter a name for the folder');
      return;
    }

    try {
      const newFolder = createFolder(
        folderForm.name.trim(),
        folderForm.description.trim() || undefined,
        saveForm.folderId, // Create as child of currently selected folder
        folderForm.color,
        getFoldersStorageKey()
      );

      // Set the newly created folder as selected
      setSaveForm({ ...saveForm, folderId: newFolder.id });
      setFolderForm({ name: '', description: '', color: '#007bff', parentId: undefined });
      setShowCreateFolderInSave(false);
      loadData();
      updateStorageInfo();
    } catch (error) {
      alert(`Failed to create folder: ${error}`);
    }
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer__modal-content">
        <div className="file-explorer__header">
          <h2>📁 Rule Library</h2>
          <button className="file-explorer__close" onClick={onClose}>×</button>
        </div>

        <div className="file-explorer__toolbar">
          <div className="file-explorer__search">
            <input
              type="text"
              placeholder="🔍 Search rules..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="file-explorer__search-input"
            />
          </div>
          
          <div className="file-explorer__view-controls">
            <button
              className={`file-explorer__view-button ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
              title="Tree view"
            >
              🌳
            </button>
            <button
              className={`file-explorer__view-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              📋
            </button>
          </div>
          
          <div className="file-explorer__actions">
            <button
              className="file-explorer__button file-explorer__button--primary"
              onClick={() => {
                setSaveForm({ ...saveForm, folderId: currentFolderId });
                setShowSaveDialog(true);
              }}
              title="Save current rule"
            >
              💾 Save
            </button>
            
            <button
              className="file-explorer__button"
              onClick={() => setShowCreateFolderDialog(true)}
              title="Create new folder"
            >
              📁+ Folder
            </button>
            
            <button
              className="file-explorer__button"
              onClick={handleDeleteItems}
              disabled={selectedItems.size === 0}
              title="Delete selected items"
            >
              🗑️ Delete
            </button>
            
            <button
              className="file-explorer__button"
              onClick={handleExportRules}
              title="Export all"
            >
              📤 Export
            </button>
            
            <button
              className="file-explorer__button"
              onClick={handleImportRules}
              title="Import"
            >
              📥 Import
            </button>
          </div>
        </div>

        <div className="file-explorer__status">
          <span>{storageInfo.ruleCount} rules, {storageInfo.folderCount} folders</span>
          <span>Storage: {formatFileSize(storageInfo.storageSize)}</span>
          <span>{selectedItems.size} selected</span>
        </div>

        <div className="file-explorer__content">
          {searchQuery && viewMode === 'list' ? (
            renderListView()
          ) : (
            <div className="file-explorer__tree">
              {folderTree.length === 0 ? (
                <div className="file-explorer__empty">
                  <div className="file-explorer__empty-icon">📁</div>
                  <div className="file-explorer__empty-text">No rules or folders yet</div>
                  <div className="file-explorer__empty-subtext">Create your first rule or folder to get started</div>
                </div>
              ) : (
                folderTree.map(item => renderTreeItem(item))
              )}
            </div>
          )}
        </div>

        {/* Save Rule Dialog */}
        {showSaveDialog && (
          <div className="file-explorer__modal">
            <div className="file-explorer__modal-content">
              <div className="file-explorer__modal-header">
                <h3>💾 Save Rule</h3>
                <button onClick={() => setShowSaveDialog(false)}>×</button>
              </div>
              
              <div className="file-explorer__modal-body">
                <div className="file-explorer__form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={saveForm.name}
                    onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
                    placeholder="Enter rule name"
                  />
                </div>
                
                <div className="file-explorer__form-group">
                  <label>Description</label>
                  <textarea
                    value={saveForm.description}
                    onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                
                <div className="file-explorer__form-group">
                  <label>Tags</label>
                  <input
                    type="text"
                    value={saveForm.tags}
                    onChange={(e) => setSaveForm({ ...saveForm, tags: e.target.value })}
                    placeholder="Comma-separated tags"
                  />
                </div>

                <div className="file-explorer__form-group">
                  <label>Folder</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <select
                        value={saveForm.folderId || ''}
                        onChange={(e) => setSaveForm({ ...saveForm, folderId: e.target.value || undefined })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      >
                        {buildFolderOptions().map((option) => (
                          <option key={option.value || 'root'} value={option.value || ''}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreateFolderInSave(true)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                      title="Create new folder"
                    >
                      📁+
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="file-explorer__modal-footer">
                <button 
                  onClick={() => setShowSaveDialog(false)}
                  style={{ 
                    padding: '0.5rem 1rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#333',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveRule}
                  style={{ 
                    padding: '0.5rem 1rem',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Save Rule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Folder Dialog (from Save Dialog) */}
        {showCreateFolderInSave && (
          <div className="file-explorer__modal" style={{ zIndex: 1200 }}>
            <div className="file-explorer__modal-content">
              <div className="file-explorer__modal-header">
                <h3>📁 Create Folder</h3>
                <button onClick={() => setShowCreateFolderInSave(false)}>×</button>
              </div>
              
              <div className="file-explorer__modal-body">
                <div className="file-explorer__form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                    placeholder="Enter folder name"
                  />
                </div>
                
                <div className="file-explorer__form-group">
                  <label>Description</label>
                  <textarea
                    value={folderForm.description}
                    onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                
                <div className="file-explorer__form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={folderForm.color}
                    onChange={(e) => setFolderForm({ ...folderForm, color: e.target.value })}
                  />
                </div>

                <div className="file-explorer__form-group">
                  <label>Parent Folder</label>
                  <select
                    value={saveForm.folderId || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      backgroundColor: '#f8f9fa',
                      color: '#666'
                    }}
                  >
                    {buildFolderOptions()
                      .filter(option => option.value === saveForm.folderId || (!saveForm.folderId && option.value === undefined))
                      .map((option) => (
                        <option key={option.value || 'root'} value={option.value || ''}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                  <small style={{ color: '#666', fontSize: '0.75rem' }}>
                    New folder will be created inside the selected folder
                  </small>
                </div>
              </div>
              
              <div className="file-explorer__modal-footer">
                <button 
                  onClick={() => setShowCreateFolderInSave(false)}
                  style={{ 
                    padding: '0.5rem 1rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#333',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFolderInSave}
                  style={{ 
                    padding: '0.5rem 1rem',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Folder Dialog */}
        {showCreateFolderDialog && (
          <div className="file-explorer__modal">
            <div className="file-explorer__modal-content">
              <div className="file-explorer__modal-header">
                <h3>📁 Create Folder</h3>
                <button onClick={() => setShowCreateFolderDialog(false)}>×</button>
              </div>
              
              <div className="file-explorer__modal-body">
                <div className="file-explorer__form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                    placeholder="Enter folder name"
                  />
                </div>
                
                <div className="file-explorer__form-group">
                  <label>Description</label>
                  <textarea
                    value={folderForm.description}
                    onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                
                <div className="file-explorer__form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={folderForm.color}
                    onChange={(e) => setFolderForm({ ...folderForm, color: e.target.value })}
                  />
                </div>

                <div className="file-explorer__form-group">
                  <label>Parent Folder</label>
                  <select
                    value={folderForm.parentId || ''}
                    onChange={(e) => setFolderForm({ ...folderForm, parentId: e.target.value || undefined })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  >
                    {buildFolderOptions().map((option) => (
                      <option key={option.value || 'root'} value={option.value || ''}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666', fontSize: '0.75rem' }}>
                    Choose where to create the new folder
                  </small>
                </div>
              </div>
              
              <div className="file-explorer__modal-footer">
                <button 
                  onClick={() => setShowCreateFolderDialog(false)}
                  style={{ 
                    padding: '0.5rem 1rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#333',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFolder}
                  style={{ 
                    padding: '0.5rem 1rem',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default SavedRulesManager;