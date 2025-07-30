import * as React from "react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "./dropdown-menu";

interface Option {
  label: string;
  value: string | number;
}

type DropdownButtonProps = {
  label: string;
  options: Option[];
  selected: string | number | (string | number)[];
  onSelect: (value: string | number) => void;
  multiSelect?: boolean;
  className?: string;
  widthClass?: string; // e.g. 'min-w-[200px]'
  disabled?: boolean;
};

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  label,
  options,
  selected,
  onSelect,
  multiSelect = false,
  className = "",
  widthClass = "min-w-[200px]",
  disabled = false,
}) => {
  // For multi-select, selected is an array
  const isSelected = (value: string | number) =>
    Array.isArray(selected) ? selected.includes(value) : selected === value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center justify-between ${widthClass} ${className}`}
          disabled={disabled}
        >
          <span className="truncate text-left flex-1">
            {multiSelect
              ? Array.isArray(selected) && selected.length > 0
                ? `${selected.length} selected`
                : label
              : options.find((opt) => opt.value === selected)?.label || label}
          </span>
          {/* Dropdown Arrow SVG */}
          <svg
            className="w-4 h-4 ml-2 text-black-500 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={widthClass}>
        {options.map((opt) =>
          multiSelect ? (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={isSelected(opt.value)}
              onCheckedChange={() => onSelect(opt.value)}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ) : (
            <DropdownMenuItem
              key={opt.value}
              onSelect={() => onSelect(opt.value)}
              className={isSelected(opt.value) ? "bg-accent" : ""}
            >
              {opt.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
