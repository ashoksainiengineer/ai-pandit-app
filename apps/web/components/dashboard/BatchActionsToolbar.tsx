/**
 * BatchActionsToolbar Component
 * Toolbar for batch operations on selected sessions
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Download,
  Star,
  Tag,
  X,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import { BatchOperation } from '@/lib/dashboard/types';

interface BatchActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBatchOperation: (operation: BatchOperation) => void;
  totalCount: number;
}

export function BatchActionsToolbar({
  selectedCount,
  onClearSelection,
  onSelectAll,
  onBatchOperation,
  totalCount,
}: BatchActionsToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  const handleExport = () => {
    onBatchOperation({
      type: 'export',
      sessionIds: [], // Will be filled by parent
      payload: { format: exportFormat },
    });
  };

  const handleFavorite = () => {
    onBatchOperation({
      type: 'favorite',
      sessionIds: [],
    });
  };

  const handleDelete = () => {
    onBatchOperation({
      type: 'delete',
      sessionIds: [],
    });
    setShowDeleteConfirm(false);
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="
            fixed bottom-8 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-4 px-6 py-4
            bg-white/95 backdrop-blur-xl
            border border-[#F0E8DE] rounded-2xl
            shadow-2xl shadow-black/10
          "
        >
          {/* Selection Info */}
          <div className="flex items-center gap-3 pr-4 border-r border-[#F0E8DE]">
            <div className="w-8 h-8 rounded-xl bg-[#78611D]/20 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-[#78611D]" />
            </div>
            <div>
              <span className="text-[#1A1612] font-semibold">{selectedCount}</span>
              <span className="text-[#7A756F] text-sm ml-1">selected</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Favorite */}
            <button
              onClick={handleFavorite}
              className="
                flex items-center gap-2 px-4 py-2 rounded-xl
                bg-[#78611D]/10 text-[#78611D]
                hover:bg-[#78611D]/20 transition-colors
                border border-[#78611D]/20
              "
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Favorite</span>
            </button>

            {/* Export */}
            <div className="relative group">
              <button
                onClick={handleExport}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-xl
                  bg-[#3B82F6]/10 text-[#3B82F6]
                  hover:bg-[#3B82F6]/20 transition-colors
                  border border-[#3B82F6]/20
                "
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              {/* Export Format Dropdown */}
              <div className="
                absolute bottom-full left-0 mb-2
                hidden group-hover:flex flex-col gap-1
                bg-white border border-[#F0E8DE] rounded-xl p-2
                shadow-xl
              ">
                {(['json', 'csv', 'pdf'] as const).map(format => (
                  <button
                    key={format}
                    onClick={() => setExportFormat(format)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm text-left capitalize
                      ${exportFormat === format 
                        ? 'bg-[#78611D]/20 text-[#78611D]' 
                        : 'text-[#7A756F] hover:bg-[#F5EFE7]'
                      }
                    `}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag */}
            <button
              onClick={() => onBatchOperation({ type: 'tag', sessionIds: [], payload: { tag: 'new-tag' } })}
              className="
                flex items-center gap-2 px-4 py-2 rounded-xl
                bg-[#6A0572]/10 text-[#9D4EDD]
                hover:bg-[#6A0572]/20 transition-colors
                border border-[#6A0572]/20
              "
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Tag</span>
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="
                flex items-center gap-2 px-4 py-2 rounded-xl
                bg-[#EF4444]/10 text-[#EF4444]
                hover:bg-[#EF4444]/20 transition-colors
                border border-[#EF4444]/20
              "
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="
              p-2 rounded-xl text-[#7A756F]
              hover:text-[#4A453F] hover:bg-[#F5EFE7]
              transition-colors
            "
          >
            <X className="w-5 h-5" />
          </button>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="
              absolute bottom-full left-1/2 -translate-x-1/2 mb-4
              w-80 p-4 bg-white border border-[#EF4444]/30 rounded-xl
              shadow-2xl
            ">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1A1612]">Delete {selectedCount} sessions?</h4>
                  <p className="text-sm text-[#7A756F] mt-1">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#F0E8DE] text-[#4A453F] hover:bg-[#F5EFE7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#EF4444] text-white hover:bg-[#EF4444]/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
