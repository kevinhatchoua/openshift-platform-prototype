import {
  FC,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  MenuProps,
  MenuToggle,
  Popper,
  ToolbarFilter,
  ToolbarLabel,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";

const isToolbarLabel = (label: string | ToolbarLabel): label is ToolbarLabel =>
  typeof label === "object" && "key" in label;

export type DataViewSingleSelectOption = { label: string; value: string };

export interface DataViewSingleSelectFilterProps extends Omit<MenuProps, "onSelect" | "onChange"> {
  filterId: string;
  value?: string;
  title: string;
  chipTitle?: string;
  placeholder?: string;
  options: (DataViewSingleSelectOption | string)[];
  onChange?: (event?: ReactMouseEvent, value?: string) => void;
  showToolbarItem?: boolean;
  showIcon?: boolean;
  /** When false, the applied filter chip cannot be cleared (required single choice). */
  allowClear?: boolean;
  ouiaId?: string;
}

export const DataViewSingleSelectFilter: FC<DataViewSingleSelectFilterProps> = ({
  filterId,
  title,
  chipTitle,
  value,
  onChange,
  placeholder,
  options = [],
  showToolbarItem,
  showIcon = !placeholder,
  allowClear = false,
  ouiaId = "DataViewSingleSelectFilter",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryName = chipTitle ?? title;

  const normalizeOptions = useMemo(
    () =>
      options.map((option) =>
        typeof option === "string" ? { label: option, value: option } : option,
      ),
    [options],
  );

  const activeOption = useMemo(
    () => normalizeOptions.find((option) => option.value === value),
    [normalizeOptions, value],
  );

  const handleToggleClick = (event: ReactMouseEvent) => {
    event.stopPropagation();
    setTimeout(() => {
      const firstElement = menuRef.current?.querySelector(
        "li > button:not(:disabled)",
      ) as HTMLElement;
      firstElement?.focus();
    }, 0);
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (event?: ReactMouseEvent, itemId?: string | number) => {
    const next = String(itemId);
    onChange?.(event, next);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      isOpen &&
      menuRef.current &&
      toggleRef.current &&
      !menuRef.current.contains(event.target as Node) &&
      !toggleRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const chipLabels =
    activeOption != null
      ? [{ key: activeOption.value, node: activeOption.label }]
      : [];

  return (
    <div ref={containerRef}>
      <ToolbarFilter
        key={ouiaId}
        data-ouia-component-id={ouiaId}
        labels={chipLabels}
        deleteLabel={
          allowClear
            ? (_, label) => {
                const key = isToolbarLabel(label) ? label.key : String(label);
                if (key === value) {
                  onChange?.(undefined, undefined);
                }
              }
            : undefined
        }
        categoryName={categoryName}
        showToolbarItem={showToolbarItem}
      >
        <Popper
          trigger={
            <MenuToggle
              ouiaId={`${ouiaId}-toggle`}
              ref={toggleRef}
              onClick={handleToggleClick}
              isExpanded={isOpen}
              icon={showIcon ? <FilterIcon /> : undefined}
              style={{ width: "200px" }}
            >
              {placeholder ?? title}
            </MenuToggle>
          }
          triggerRef={toggleRef}
          popper={
            <Menu
              ref={menuRef}
              ouiaId={`${ouiaId}-menu`}
              onSelect={handleSelect}
              selected={value}
              {...props}
            >
              <MenuContent>
                <MenuList>
                  {normalizeOptions.map((option) => (
                    <MenuItem
                      data-ouia-component-id={`${ouiaId}-filter-item-${option.value}`}
                      key={option.value}
                      itemId={option.value}
                      isSelected={value === option.value}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuContent>
            </Menu>
          }
          popperRef={menuRef}
          appendTo={containerRef.current || undefined}
          aria-label={`${title ?? filterId} filter`}
          isVisible={isOpen}
        />
      </ToolbarFilter>
    </div>
  );
};
