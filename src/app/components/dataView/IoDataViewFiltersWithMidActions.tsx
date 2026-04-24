import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  MenuToggle,
  Popper,
  ToolbarGroup,
  ToolbarToggleGroup,
  type ToolbarToggleGroupProps,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";

type FilterChildProps = { filterId: string; title: string };

/**
 * {@link https://github.com/patternfly/react-data-view | @patternfly/react-data-view} `DataViewFilters`
 * with a slot for toolbar actions between the attribute (Name / Status / …) menu and the active
 * value control. Used for Installed Operators: advanced filter, manage columns, bulk approve, catalog
 * link sit to the left of the search field while the attribute control stays on the left.
 */
export function IoDataViewFiltersWithMidActions<T extends Record<string, unknown>>({
  children,
  midContent,
  ouiaId = "IoDataViewFiltersWithMidActions",
  toggleIcon = <FilterIcon />,
  breakpoint = "xl",
  onChange,
  values,
  ...rest
}: {
  children: ReactNode;
  /** Rendered after the filter-attribute menu, before the active filter’s value field. */
  midContent: ReactNode;
  values: T;
  onChange: (filterId: string, partial: Partial<Record<keyof T, unknown>>) => void;
  ouiaId?: string;
  toggleIcon?: ReactNode;
} & Omit<ToolbarToggleGroupProps, "children" | "toggleIcon" | "breakpoint"> &
  Pick<ToolbarToggleGroupProps, "breakpoint">) {
  const [activeAttributeMenu, setActiveAttributeMenu] = useState("");
  const [isAttributeMenuOpen, setIsAttributeMenuOpen] = useState(false);
  const attributeToggleRef = useRef<HTMLButtonElement>(null);
  const attributeMenuRef = useRef<HTMLDivElement>(null);
  const attributeContainerRef = useRef<HTMLDivElement>(null);
  const childrenHash = useMemo(
    () =>
      JSON.stringify(
        Children.map(children, (c) => (isValidElement(c) ? { type: c.type, key: c.key, props: c.props } : c))
      ),
    [children]
  );
  const filterItems = useMemo(
    () =>
      Children.toArray(children)
        .map((c) => {
          if (isValidElement<FilterChildProps>(c) && c.props?.filterId != null && c.props?.title != null) {
            return { filterId: String(c.props.filterId), title: String(c.props.title) };
          }
          return undefined;
        })
        .filter((item): item is { filterId: string; title: string } => item != null),
    [childrenHash] // eslint-disable-line react-hooks/exhaustive-deps -- same as upstream DataViewFilters
  );
  useEffect(() => {
    if (filterItems.length > 0) {
      setActiveAttributeMenu(filterItems[0].title);
    }
  }, [filterItems]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isAttributeMenuOpen) {
        return;
      }
      const t = event.target;
      if (!(t instanceof Node)) {
        return;
      }
      if (
        attributeMenuRef.current?.contains(t) ||
        attributeToggleRef.current?.contains(t) ||
        false
      ) {
        return;
      }
      setIsAttributeMenuOpen(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [isAttributeMenuOpen]);

  const attributeToggle = (
    <MenuToggle
      ref={attributeToggleRef}
      onClick={() => setIsAttributeMenuOpen((o) => !o)}
      isExpanded={isAttributeMenuOpen}
      icon={toggleIcon}
    >
      {activeAttributeMenu}
    </MenuToggle>
  );
  const attributeMenu = (
    <Menu
      ref={attributeMenuRef}
      onSelect={(_ev, itemId) => {
        const id = String(itemId);
        const selectedItem = filterItems.find((item) => item.filterId === id);
        if (selectedItem) {
          setActiveAttributeMenu(selectedItem.title);
        }
        setIsAttributeMenuOpen(false);
      }}
    >
      <MenuContent>
        <MenuList>
          {filterItems.map((item) => (
            <MenuItem key={item.filterId} itemId={item.filterId}>
              {item.title}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );
  return (
    <ToolbarToggleGroup
      data-ouia-component-id={ouiaId}
      toggleIcon={toggleIcon}
      breakpoint={breakpoint}
      {...rest}
    >
      <ToolbarGroup variant="filter-group" className="ocs-io-filters-mid__group">
        <div ref={attributeContainerRef}>
          <Popper
            trigger={attributeToggle}
            triggerRef={attributeToggleRef}
            popper={attributeMenu}
            popperRef={attributeMenuRef}
            appendTo={attributeContainerRef.current || undefined}
            isVisible={isAttributeMenuOpen}
          />
        </div>
        {midContent}
        {Children.map(children, (child) => {
          if (isValidElement<FilterChildProps & Record<string, unknown>>(child)) {
            return cloneElement(child, {
              ...child.props,
              showToolbarItem: activeAttributeMenu === child.props.title,
              onChange: (_ev: unknown, value: unknown) =>
                onChange(String(child.props.filterId), { [child.props.filterId]: value } as Partial<
                  Record<keyof T, unknown>
                >),
              value: values[child.props.filterId as keyof T] as string | string[] | undefined,
            });
          }
          return child;
        })}
      </ToolbarGroup>
    </ToolbarToggleGroup>
  );
}
