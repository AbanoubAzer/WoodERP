import React from 'react';
import Select from 'react-select';

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

export function SearchableSelect({ options, value, onChange, placeholder, className, isLoading }: SearchableSelectProps) {
  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <div className={className}>
      <Select
        value={selectedOption}
        onChange={(selected) => onChange(selected ? selected.value : '')}
        options={options}
        placeholder={placeholder || 'اختر...'}
        isSearchable
        isLoading={isLoading}
        noOptionsMessage={() => 'لا توجد نتائج'}
        styles={{
          control: (base, state) => ({
            ...base,
            border: state.isFocused ? '1px solid #10b981' : '1px solid #e2e8f0',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
            borderRadius: '0.75rem',
            padding: '4px',
            backgroundColor: 'white',
            '&:hover': {
              border: state.isFocused ? '1px solid #10b981' : '1px solid #cbd5e1'
            }
          }),
          menu: (base) => ({
            ...base,
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected 
              ? '#10b981' 
              : state.isFocused 
                ? '#ecfdf5' 
                : 'white',
            color: state.isSelected ? 'white' : '#0f172a',
            cursor: 'pointer',
            padding: '10px 16px',
            '&:active': {
              backgroundColor: '#34d399'
            }
          })
        }}
      />
    </div>
  );
}
