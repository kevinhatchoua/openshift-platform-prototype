import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  MenuToggle,
  type MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from "@patternfly/react-core";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

const NO_RESULTS = "__no_results__";

export interface TypeaheadSelectProps {
  id: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  "aria-label"?: string;
}

/**
 * PatternFly 6.5 searchable single-select (MenuToggle typeahead + Select variant="typeahead").
 */
export default function TypeaheadSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Select",
  isDisabled = false,
  "aria-label": ariaLabel,
}: TypeaheadSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filterValue, setFilterValue] = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);
  const listboxId = `${id}-listbox`;

  useEffect(() => {
    setInputValue(value);
    if (!value) {
      setFilterValue("");
    }
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!filterValue) {
      return [...options];
    }
    const needle = filterValue.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(needle));
  }, [filterValue, options]);

  const closeMenu = () => {
    setIsOpen(false);
    setFilterValue("");
    setInputValue(value);
  };

  const selectOption = (next: string) => {
    setInputValue(next);
    setFilterValue("");
    onChange(next);
    setIsOpen(false);
  };

  const onSelect = (_event: unknown, selectedValue: string | number | undefined) => {
    if (!selectedValue || selectedValue === NO_RESULTS) {
      return;
    }
    selectOption(String(selectedValue));
  };

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, next: string) => {
    setInputValue(next);
    setFilterValue(next);
    if (next !== value) {
      onChange("");
    }
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      isFullWidth
      isExpanded={isOpen}
      isDisabled={isDisabled}
      aria-label={ariaLabel}
      onClick={() => {
        if (isDisabled) {
          return;
        }
        setIsOpen((open) => !open);
        textInputRef.current?.focus();
      }}
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          onClick={() => {
            if (!isDisabled && !isOpen) {
              setIsOpen(true);
            }
          }}
          onChange={onTextInputChange}
          id={`${id}-input`}
          autoComplete="off"
          innerRef={textInputRef}
          placeholder={placeholder}
          role="combobox"
          isExpanded={isOpen}
          aria-controls={listboxId}
          disabled={isDisabled}
        />
        <TextInputGroupUtilities {...(!inputValue ? { style: { display: "none" } } : {})}>
          <Button
            variant="plain"
            aria-label={`Clear ${ariaLabel ?? id}`}
            onClick={() => {
              onChange("");
              setInputValue("");
              setFilterValue("");
              textInputRef.current?.focus();
            }}
            isDisabled={isDisabled}
            icon={<TimesIcon />}
          />
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Select
      id={id}
      variant="typeahead"
      isOpen={isOpen}
      selected={value}
      onSelect={onSelect}
      onOpenChange={(open) => {
        if (!open) {
          closeMenu();
        }
      }}
      toggle={toggle}
      shouldFocusFirstItemOnOpen={false}
      // Keep the menu below the field (modal space above triggers Popper flip otherwise)
      popperProps={{ direction: "down", enableFlip: false }}
      maxMenuHeight="12rem"
      isScrollable
    >
      <SelectList id={listboxId}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <SelectOption key={option} value={option}>
              {option}
            </SelectOption>
          ))
        ) : (
          <SelectOption isAriaDisabled value={NO_RESULTS}>
            {filterValue ? `No results found for "${filterValue}"` : "No options"}
          </SelectOption>
        )}
      </SelectList>
    </Select>
  );
}
