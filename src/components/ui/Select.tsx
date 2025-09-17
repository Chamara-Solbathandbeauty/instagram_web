'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  children,
  placeholder,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div ref={selectRef} className={`relative ${className}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  className = '',
  onClick,
  disabled = false,
}) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  const handleClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      onClick?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = '',
}) => {
  const { isOpen } = React.useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <div className={`absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg ${className}`}>
      <div className="max-h-60 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  className = '',
  onClick,
}) => {
  const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(SelectContext);

  const handleClick = () => {
    onValueChange?.(value);
    setIsOpen(false);
    onClick?.();
  };

  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
        isSelected ? 'bg-[#fef7f5] text-[#ef5a29]' : 'text-gray-900'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder,
  children,
}) => {
  const { value } = React.useContext(SelectContext);

  if (children) {
    return <>{children}</>;
  }

  if (value) {
    return <span className="text-gray-900">{value}</span>;
  }

  return <span className="text-gray-400">{placeholder}</span>;
};
