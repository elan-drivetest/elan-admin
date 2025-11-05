// components/ui/SearchableSelect.tsx

// Add this import at the top (create the popover component if it doesn't exist)
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, ChevronDown, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Replace the Popover components with a simpler dropdown implementation
interface Option {
  id: number | string;
  label: string;
  subtitle?: string;
  badge?: string;
}

interface SearchableSelectProps {
  label: string;
  options: Option[];
  value?: number | string | null;
  onSelect: (value: number | string | null) => void;
  placeholder?: string;
  required?: boolean;
  isLoading?: boolean;
  error?: string;
  allowClear?: boolean;
  emptyMessage?: string;
}

export default function SearchableSelect({
  label,
  options,
  value,
  onSelect,
  placeholder = "Select an option",
  required = false,
  isLoading = false,
  error,
  allowClear = true,
  emptyMessage = "No options available"
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.subtitle && option.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedOption = options.find(option => option.id === value);

  const handleSelect = (optionValue: number | string | null) => {
    onSelect(optionValue);
    setOpen(false);
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{required ? `${label} *` : label}</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-600">Loading {label.toLowerCase()}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      <Label>{required ? `${label} *` : label}</Label>
      
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setOpen(!open)}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{selectedOption.badge}</span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        
        {open && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1">
            <CardContent className="p-0">
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={`Search ${label.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {allowClear && !required && (
                  <div
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 border-b"
                    onClick={() => handleSelect(null)}
                  >
                    <span className="text-gray-500">None selected</span>
                  </div>
                )}
                
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    {searchTerm ? 'No results found.' : emptyMessage}
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option.id}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                      onClick={() => handleSelect(option.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{option.label}</div>
                          {option.subtitle && (
                            <div className="text-xs text-gray-500 truncate">{option.subtitle}</div>
                          )}
                        </div>
                        {option.badge && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded ml-2">{option.badge}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedOption && allowClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleSelect(null)}
          className="h-6 px-2 text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}