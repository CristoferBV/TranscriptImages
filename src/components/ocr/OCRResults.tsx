import React, { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { OCRResult } from '../../hooks/useOCR';

interface OCRResultsProps {
  result: OCRResult;
  onSave: (data: OCRResult) => void;
  onClose: () => void;
  saving?: boolean;
}

const OCRResults: React.FC<OCRResultsProps> = ({ 
  result, 
  onSave, 
  onClose,
  saving = false 
}) => {
  const [editingData, setEditingData] = useState<OCRResult>(result);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleArrayEdit = (section: keyof Pick<OCRResult, 'materials' | 'measurements' | 'instructions'>, value: string) => {
    const items = value.split('\n').filter(item => item.trim() !== '');
    setEditingData(prev => ({ ...prev, [section]: items }));
  };

  const handleSave = () => {
    onSave(editingData);
  };

  const sections = [
    {
      key: 'materials',
      title: 'Materials',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
    },
    {
      key: 'measurements',
      title: 'Measurements',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-800',
    },
    {
      key: 'instructions',
      title: 'Installation Instructions',
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-800',
    },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Extracted Content
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-200px)]">
          {/* Full Text Section */}
          <Card>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Full Text</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'fullText' ? null : 'fullText')}
                className="touch-manipulation"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
            
            {editingSection === 'fullText' ? (
              <textarea
                value={editingData.fullText}
                onChange={(e) => setEditingData(prev => ({ ...prev, fullText: e.target.value }))}
                className="w-full h-32 sm:h-40 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                {editingData.fullText || 'No text extracted'}
              </p>
            )}
          </Card>

          {/* Categorized Sections */}
          {sections.map(({ key, title, color, textColor }) => (
            <Card key={key} className={color}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className={`text-base sm:text-lg font-medium ${textColor}`}>{title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSection(editingSection === key ? null : key)}
                  className="touch-manipulation"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
              
              {editingSection === key ? (
                <textarea
                  value={editingData[key].join('\n')}
                  onChange={(e) => handleArrayEdit(key, e.target.value)}
                  className="w-full h-32 sm:h-40 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder={`Enter ${title.toLowerCase()}, one per line`}
                />
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {editingData[key].length > 0 ? (
                    editingData[key].map((item, index) => (
                      <div key={index} className="bg-white p-2 sm:p-3 rounded-lg border shadow-sm">
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No {title.toLowerCase()} identified</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 safe-area-bottom">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            Save Project
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OCRResults;