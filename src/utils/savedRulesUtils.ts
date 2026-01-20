import { SavedRule, SavedRuleMetadata, SavedRuleFolder, FolderTreeItem, RuleGroup } from '../types';
import { countRules, countGroups } from './ruleUtils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default storage keys
 */
const DEFAULT_RULES_STORAGE_KEY = 'rule-builder-saved-rules';
const DEFAULT_FOLDERS_STORAGE_KEY = 'rule-builder-saved-folders';

/**
 * Save a rule to localStorage
 */
export function saveRule(
  rule: RuleGroup,
  name: string,
  description?: string,
  tags?: string[],
  folderId?: string,
  storageKey: string = DEFAULT_RULES_STORAGE_KEY
): SavedRule {
  const savedRule: SavedRule = {
    id: uuidv4(),
    name,
    description,
    rule: JSON.parse(JSON.stringify(rule)), // Deep clone
    createdAt: new Date(),
    updatedAt: new Date(),
    tags,
    folderId
  };

  const existingRules = getSavedRules(storageKey);
  const updatedRules = [...existingRules, savedRule];
  
  localStorage.setItem(storageKey, JSON.stringify(updatedRules));
  
  return savedRule;
}

/**
 * Update an existing saved rule
 */
export function updateSavedRule(
  id: string,
  updates: Partial<Omit<SavedRule, 'id' | 'createdAt'>>,
  storageKey: string = DEFAULT_RULES_STORAGE_KEY
): SavedRule | null {
  const existingRules = getSavedRules(storageKey);
  const ruleIndex = existingRules.findIndex(rule => rule.id === id);
  
  if (ruleIndex === -1) {
    return null;
  }
  
  const updatedRule: SavedRule = {
    ...existingRules[ruleIndex],
    ...updates,
    updatedAt: new Date()
  };
  
  existingRules[ruleIndex] = updatedRule;
  localStorage.setItem(storageKey, JSON.stringify(existingRules));
  
  return updatedRule;
}

// ===== FOLDER MANAGEMENT FUNCTIONS =====

/**
 * Create a new folder
 */
export function createFolder(
  name: string,
  description?: string,
  parentId?: string,
  color?: string,
  foldersStorageKey: string = DEFAULT_FOLDERS_STORAGE_KEY
): SavedRuleFolder {
  const folder: SavedRuleFolder = {
    id: uuidv4(),
    name,
    description,
    parentId,
    createdAt: new Date(),
    updatedAt: new Date(),
    color
  };

  const existingFolders = getSavedFolders(foldersStorageKey);
  const updatedFolders = [...existingFolders, folder];
  
  localStorage.setItem(foldersStorageKey, JSON.stringify(updatedFolders));
  
  return folder;
}

/**
 * Get all saved folders from localStorage
 */
export function getSavedFolders(foldersStorageKey: string = DEFAULT_FOLDERS_STORAGE_KEY): SavedRuleFolder[] {
  try {
    const stored = localStorage.getItem(foldersStorageKey);
    if (!stored) return [];
    
    const folders = JSON.parse(stored) as SavedRuleFolder[];
    
    // Convert date strings back to Date objects
    return folders.map(folder => ({
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt)
    }));
  } catch (error) {
    console.error('Error loading saved folders:', error);
    return [];
  }
}

/**
 * Update an existing folder
 */
export function updateFolder(
  id: string,
  updates: Partial<Omit<SavedRuleFolder, 'id' | 'createdAt'>>,
  foldersStorageKey: string = DEFAULT_FOLDERS_STORAGE_KEY
): SavedRuleFolder | null {
  const existingFolders = getSavedFolders(foldersStorageKey);
  const folderIndex = existingFolders.findIndex(folder => folder.id === id);
  
  if (folderIndex === -1) {
    return null;
  }
  
  const updatedFolder: SavedRuleFolder = {
    ...existingFolders[folderIndex],
    ...updates,
    updatedAt: new Date()
  };
  
  existingFolders[folderIndex] = updatedFolder;
  localStorage.setItem(foldersStorageKey, JSON.stringify(existingFolders));
  
  return updatedFolder;
}

/**
 * Delete a folder and optionally move its contents
 */
export function deleteFolder(
  id: string,
  moveContentsToParent: boolean = true,
  rulesStorageKey: string = DEFAULT_RULES_STORAGE_KEY,
  foldersStorageKey: string = DEFAULT_FOLDERS_STORAGE_KEY
): boolean {
  const existingFolders = getSavedFolders(foldersStorageKey);
  const folderToDelete = existingFolders.find(folder => folder.id === id);
  
  if (!folderToDelete) {
    return false;
  }
  
  // Handle folder contents
  if (moveContentsToParent) {
    // Move child folders to parent
    const childFolders = existingFolders.filter(folder => folder.parentId === id);
    childFolders.forEach(childFolder => {
      updateFolder(childFolder.id, { parentId: folderToDelete.parentId }, foldersStorageKey);
    });
    
    // Move rules to parent folder
    const rules = getSavedRules(rulesStorageKey);
    const rulesInFolder = rules.filter(rule => rule.folderId === id);
    rulesInFolder.forEach(rule => {
      updateSavedRule(rule.id, { folderId: folderToDelete.parentId }, rulesStorageKey);
    });
  } else {
    // Delete all contents recursively
    const childFolders = existingFolders.filter(folder => folder.parentId === id);
    childFolders.forEach(childFolder => {
      deleteFolder(childFolder.id, false, rulesStorageKey, foldersStorageKey);
    });
    
    // Delete rules in folder
    const rules = getSavedRules(rulesStorageKey);
    const rulesInFolder = rules.filter(rule => rule.folderId === id);
    rulesInFolder.forEach(rule => {
      deleteSavedRule(rule.id, rulesStorageKey);
    });
  }
  
  // Delete the folder itself
  const filteredFolders = existingFolders.filter(folder => folder.id !== id);
  localStorage.setItem(foldersStorageKey, JSON.stringify(filteredFolders));
  
  return true;
}

/**
 * Get all saved rules from localStorage
 */
export function getSavedRules(storageKey: string = DEFAULT_RULES_STORAGE_KEY): SavedRule[] {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    
    const rules = JSON.parse(stored) as SavedRule[];
    
    // Convert date strings back to Date objects
    return rules.map(rule => ({
      ...rule,
      createdAt: new Date(rule.createdAt),
      updatedAt: new Date(rule.updatedAt)
    }));
  } catch (error) {
    console.error('Error loading saved rules:', error);
    return [];
  }
}

/**
 * Get saved rule metadata (without the full rule data for performance)
 */
export function getSavedRulesMetadata(storageKey: string = DEFAULT_RULES_STORAGE_KEY): SavedRuleMetadata[] {
  const savedRules = getSavedRules(storageKey);
  
  return savedRules.map(savedRule => ({
    id: savedRule.id,
    name: savedRule.name,
    description: savedRule.description,
    createdAt: savedRule.createdAt,
    updatedAt: savedRule.updatedAt,
    tags: savedRule.tags,
    ruleCount: countRules(savedRule.rule),
    groupCount: countGroups(savedRule.rule),
    folderId: savedRule.folderId
  }));
}

/**
 * Get a specific saved rule by ID
 */
export function getSavedRule(id: string, storageKey: string = DEFAULT_RULES_STORAGE_KEY): SavedRule | null {
  const savedRules = getSavedRules(storageKey);
  return savedRules.find(rule => rule.id === id) || null;
}

/**
 * Delete a saved rule
 */
export function deleteSavedRule(id: string, storageKey: string = DEFAULT_RULES_STORAGE_KEY): boolean {
  const existingRules = getSavedRules(storageKey);
  const filteredRules = existingRules.filter(rule => rule.id !== id);
  
  if (filteredRules.length === existingRules.length) {
    return false; // Rule not found
  }
  
  localStorage.setItem(storageKey, JSON.stringify(filteredRules));
  return true;
}

/**
 * Search saved rules by name, description, or tags
 */
export function searchSavedRules(
  query: string,
  storageKey: string = DEFAULT_RULES_STORAGE_KEY
): SavedRuleMetadata[] {
  const metadata = getSavedRulesMetadata(storageKey);
  const lowerQuery = query.toLowerCase();
  
  return metadata.filter(rule => 
    rule.name.toLowerCase().includes(lowerQuery) ||
    rule.description?.toLowerCase().includes(lowerQuery) ||
    rule.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Build folder tree structure for file explorer view
 */
export function buildFolderTree(
  rulesStorageKey: string = DEFAULT_RULES_STORAGE_KEY,
  foldersStorageKey: string = DEFAULT_FOLDERS_STORAGE_KEY
): FolderTreeItem[] {
  const folders = getSavedFolders(foldersStorageKey);
  const rules = getSavedRulesMetadata(rulesStorageKey);
  
  // Create folder items
  const folderItems: FolderTreeItem[] = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    type: 'folder' as const,
    parentId: folder.parentId,
    children: [],
    data: folder,
    expanded: false
  }));
  
  // Create rule items
  const ruleItems: FolderTreeItem[] = rules.map(rule => ({
    id: rule.id,
    name: rule.name,
    type: 'rule' as const,
    parentId: rule.folderId,
    data: rule
  }));
  
  // Combine all items
  const allItems = [...folderItems, ...ruleItems];
  
  // Build tree structure
  const itemMap = new Map<string, FolderTreeItem>();
  allItems.forEach(item => itemMap.set(item.id, item));
  
  const rootItems: FolderTreeItem[] = [];
  
  allItems.forEach(item => {
    if (!item.parentId) {
      // Root level item
      rootItems.push(item);
    } else {
      // Child item
      const parent = itemMap.get(item.parentId);
      if (parent && parent.children) {
        parent.children.push(item);
      } else {
        // Parent not found, treat as root level
        rootItems.push(item);
      }
    }
  });
  
  // Sort items: folders first, then rules, both alphabetically
  const sortItems = (items: FolderTreeItem[]): FolderTreeItem[] => {
    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }).map(item => ({
      ...item,
      children: item.children ? sortItems(item.children) : undefined
    }));
  };
  
  return sortItems(rootItems);
}

/**
 * Get rules in a specific folder
 */
export function getRulesInFolder(
  folderId: string | undefined,
  storageKey: string = DEFAULT_RULES_STORAGE_KEY
): SavedRuleMetadata[] {
  const metadata = getSavedRulesMetadata(storageKey);
  return metadata.filter(rule => rule.folderId === folderId);
}

/**
 * Move rule to a different folder
 */
export function moveRuleToFolder(
  ruleId: string,
  targetFolderId: string | undefined,
  storageKey: string = DEFAULT_RULES_STORAGE_KEY
): boolean {
  return updateSavedRule(ruleId, { folderId: targetFolderId }, storageKey) !== null;
}

/**
 * Export saved rules to JSON file
 */
export function exportSavedRules(
  rulesStorageKey: string = DEFAULT_RULES_STORAGE_KEY,
  foldersStorageKey: string = DEFAULT_FOLDERS_STORAGE_KEY
): void {
  const savedRules = getSavedRules(rulesStorageKey);
  const savedFolders = getSavedFolders(foldersStorageKey);
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '2.0', // Updated version to support folders
    rules: savedRules,
    folders: savedFolders
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `saved-rules-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import saved rules from JSON file
 */
export function importSavedRules(
  file: File,
  rulesStorageKey: string = DEFAULT_RULES_STORAGE_KEY,
  foldersStorageKey: string = DEFAULT_FOLDERS_STORAGE_KEY
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);
        
        if (!importData.rules || !Array.isArray(importData.rules)) {
          reject(new Error('Invalid file format: missing rules array'));
          return;
        }
        
        const existingRules = getSavedRules(rulesStorageKey);
        const existingFolders = getSavedFolders(foldersStorageKey);
        const existingRuleNames = new Set(existingRules.map(rule => rule.name));
        const existingFolderNames = new Set(existingFolders.map(folder => folder.name));
        
        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];
        
        const newRules: SavedRule[] = [];
        const newFolders: SavedRuleFolder[] = [];
        const folderIdMap = new Map<string, string>(); // Old ID -> New ID mapping
        
        // Import folders first (if available)
        if (importData.folders && Array.isArray(importData.folders)) {
          for (const importedFolder of importData.folders) {
            try {
              if (!importedFolder.name) {
                errors.push(`Skipped folder: missing name`);
                skipped++;
                continue;
              }
              
              if (existingFolderNames.has(importedFolder.name)) {
                errors.push(`Skipped folder "${importedFolder.name}": name already exists`);
                skipped++;
                continue;
              }
              
              const oldId = importedFolder.id;
              const newId = uuidv4();
              folderIdMap.set(oldId, newId);
              
              const savedFolder: SavedRuleFolder = {
                id: newId,
                name: importedFolder.name,
                description: importedFolder.description,
                parentId: importedFolder.parentId ? folderIdMap.get(importedFolder.parentId) : undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                color: importedFolder.color
              };
              
              newFolders.push(savedFolder);
              existingFolderNames.add(savedFolder.name);
              imported++;
            } catch (error) {
              errors.push(`Error importing folder "${importedFolder.name}": ${error}`);
              skipped++;
            }
          }
        }
        
        // Import rules
        for (const importedRule of importData.rules) {
          try {
            if (!importedRule.name || !importedRule.rule) {
              errors.push(`Skipped rule: missing name or rule data`);
              skipped++;
              continue;
            }
            
            if (existingRuleNames.has(importedRule.name)) {
              errors.push(`Skipped rule "${importedRule.name}": name already exists`);
              skipped++;
              continue;
            }
            
            // Map folder ID if it exists
            const folderId = importedRule.folderId ? folderIdMap.get(importedRule.folderId) : undefined;
            
            const savedRule: SavedRule = {
              id: uuidv4(),
              name: importedRule.name,
              description: importedRule.description,
              rule: importedRule.rule,
              createdAt: new Date(),
              updatedAt: new Date(),
              tags: importedRule.tags || [],
              folderId
            };
            
            newRules.push(savedRule);
            existingRuleNames.add(savedRule.name);
            imported++;
          } catch (error) {
            errors.push(`Error importing rule "${importedRule.name}": ${error}`);
            skipped++;
          }
        }
        
        // Save all new data
        if (newFolders.length > 0) {
          const allFolders = [...existingFolders, ...newFolders];
          localStorage.setItem(foldersStorageKey, JSON.stringify(allFolders));
        }
        
        if (newRules.length > 0) {
          const allRules = [...existingRules, ...newRules];
          localStorage.setItem(rulesStorageKey, JSON.stringify(allRules));
        }
        
        resolve({ imported, skipped, errors });
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Clear all saved rules and folders
 */
export function clearAllSavedRules(
  rulesStorageKey: string = DEFAULT_RULES_STORAGE_KEY,
  foldersStorageKey: string = DEFAULT_FOLDERS_STORAGE_KEY
): void {
  localStorage.removeItem(rulesStorageKey);
  localStorage.removeItem(foldersStorageKey);
}

/**
 * Get storage usage information
 */
export function getStorageInfo(
  rulesStorageKey: string = DEFAULT_RULES_STORAGE_KEY,
  foldersStorageKey: string = DEFAULT_FOLDERS_STORAGE_KEY
): {
  ruleCount: number;
  folderCount: number;
  storageSize: number;
  lastModified?: Date;
} {
  const savedRules = getSavedRules(rulesStorageKey);
  const savedFolders = getSavedFolders(foldersStorageKey);
  const rulesData = localStorage.getItem(rulesStorageKey) || '';
  const foldersData = localStorage.getItem(foldersStorageKey) || '';
  
  const allDates = [
    ...savedRules.map(rule => rule.updatedAt),
    ...savedFolders.map(folder => folder.updatedAt)
  ];
  
  return {
    ruleCount: savedRules.length,
    folderCount: savedFolders.length,
    storageSize: new Blob([rulesData + foldersData]).size,
    lastModified: allDates.length > 0 
      ? new Date(Math.max(...allDates.map(date => date.getTime())))
      : undefined
  };
}