import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  onSearch?: (query: string) => void;
  maxTags?: number;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  suggestions = [],
  onSearch,
  maxTags = 6,
  maxLength = 30,
  placeholder = '',
  className,
}: TagInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchValueRef = useRef<string>('');

  // Debounced search function - only calls after 300ms of no typing
  const debouncedSearch = useCallback((query: string) => {
    // Only search if the query actually changed
    if (query === lastSearchValueRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query) {
      lastSearchValueRef.current = '';
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      if (onSearch && query !== lastSearchValueRef.current) {
        lastSearchValueRef.current = query;
        onSearch(query);
      }
    }, 300); // Wait 300ms after user stops typing
  }, [onSearch]);

  useEffect(() => {
    debouncedSearch(inputValue);

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, debouncedSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizeLabel = (label: string): string => {
    // Remove special characters, keep only alphanumeric and spaces
    return label.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  };

  const addTag = (tag: string) => {
    const normalized = normalizeLabel(tag);
    if (!normalized) return;

    // Check if tag already exists (case-insensitive)
    const tagLower = normalized.toLowerCase();
    if (value.some((t) => t.toLowerCase() === tagLower)) {
      setInputValue('');
      return;
    }

    // Check max tags
    if (value.length >= maxTags) {
      return;
    }

    // Check max length
    if (normalized.length > maxLength) {
      return;
    }

    onChange([...value, normalized]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Add tag on Enter, Space, Comma, or Period
    if ([' ', ',', '.', 'Enter'].includes(e.key)) {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }

    // Remove last tag on Backspace if input is empty
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }

    // Navigate suggestions with arrow keys
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      // You can add keyboard navigation for suggestions here
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(newValue.length > 0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = suggestions.filter((suggestion) => {
    const suggestionLower = suggestion.toLowerCase();
    const inputLower = inputValue.toLowerCase();
    const isMatch = suggestionLower.includes(inputLower);
    const isNotSelected = !value.some((tag) => tag.toLowerCase() === suggestionLower);
    return isMatch && isNotSelected;
  });

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background min-h-[2.5rem] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              aria-label={t('common.removeTagAria', { tag })}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(true)}
          placeholder={value.length === 0 ? (placeholder || t('common.addLabels')) : ''}
          disabled={value.length >= maxTags}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredSuggestions.slice(0, 10).map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground mt-1">
        {t('common.labelsHelper', { count: value.length, max: maxTags })}
      </p>
    </div>
  );
}
