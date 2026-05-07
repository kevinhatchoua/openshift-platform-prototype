import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Button,
  Flex,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectList,
  SelectOption,
  TextInput,
} from "@patternfly/react-core";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import { Plus, Trash2 } from "@/lib/pfIcons";

export type ListAdvancedAttributeValueKind = "text" | "multi";

export type ListAdvancedAttributeSpec<T extends string = string> = {
  id: T;
  label: string;
  valuePlaceholder: string;
  valueKind: ListAdvancedAttributeValueKind;
  options?: { value: string; label: string }[];
};

type FilterRow = { id: string; attr: string };

export type ListAdvancedFilterModalProps<T extends string> = {
  isOpen: boolean;
  onClose: () => void;
  source: Record<T, string | string[]>;
  onSave: (next: Record<T, string | string[]>) => void;
  spec: ListAdvancedAttributeSpec<T>[];
  getEmpty: () => Record<T, string | string[]>;
  defaultAttributeWhenNoRows: T;
  title?: string;
  description?: string;
  idPrefix: string;
};

function newRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `adv-row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mergeWithEmpty<T extends string>(
  base: Record<T, string | string[]>,
  getEmpty: () => Record<T, string | string[]>
): Record<T, string | string[]> {
  return { ...getEmpty(), ...base } as Record<T, string | string[]>;
}

function buildInitialRowsFromSource<T extends string>(
  f: Record<T, string | string[]>,
  spec: ListAdvancedAttributeSpec<T>[],
  defaultWhenEmpty: T
): FilterRow[] {
  const out: FilterRow[] = [];
  for (const s of spec) {
    if (s.valueKind === "text") {
      if (String((f as Record<string, string | string[]>)[s.id] ?? "").trim()) {
        out.push({ id: newRowId(), attr: s.id });
      }
    } else if (s.valueKind === "multi") {
      const v = f[s.id];
      if (Array.isArray(v) && v.length > 0) {
        out.push({ id: newRowId(), attr: s.id });
      }
    }
  }
  if (out.length === 0) {
    out.push({ id: newRowId(), attr: defaultWhenEmpty });
  }
  return out;
}

function clearKeyInPlace<T extends string>(d: Record<T, string | string[]>, k: T) {
  const cur = d[k];
  if (Array.isArray(cur)) {
    (d as unknown as { [x: string]: string[] })[k as string] = [];
  } else {
    (d as unknown as { [x: string]: string })[k as string] = "";
  }
}

const VALUE_FIELD_MAX_WIDTH = "18rem";

function formatMultiValueToggleLabel(
  selected: string[],
  options: { value: string; label: string }[],
  placeholder: string
): string {
  if (selected.length === 0) {
    return placeholder;
  }
  if (selected.length === 1) {
    const opt = options.find((o) => o.value === selected[0]);
    return opt?.label ?? selected[0];
  }
  return `${selected.length} selected`;
}

/**
 * HPUX-1429 / CONSOLE-5091: attribute row + value control + remove; “+” on the last row.
 * Stays in sync with toolbar by saving the same filter shape the Data View hooks use.
 */
export function ListAdvancedFilterModal<T extends string>({
  isOpen,
  onClose,
  source,
  onSave,
  spec,
  getEmpty,
  defaultAttributeWhenNoRows,
  title = "Advanced filter",
  description = "Each row uses the same attribute and value controls as the toolbar filter above the table.",
  idPrefix,
}: ListAdvancedFilterModalProps<T>): ReactNode {
  const headerTitleId = `${idPrefix}-title`;
  const headerDescId = `${idPrefix}-body`;
  const [rows, setRows] = useState<FilterRow[]>([]);
  const [draft, setDraft] = useState<Record<string, string | string[]>>(
    () => getEmpty() as unknown as Record<string, string | string[]>
  );
  const [attrSelectOpen, setAttrSelectOpen] = useState<string | null>(null);
  const [valueMultiOpenRowId, setValueMultiOpenRowId] = useState<string | null>(null);
  const wasOpen = useRef(false);
  const rowBaseId = useId();

  const sourceRef = useRef(source);
  sourceRef.current = source;

  const reinitialize = useCallback(() => {
    const merged = mergeWithEmpty(
      sourceRef.current as unknown as Record<T, string | string[]>,
      getEmpty
    ) as unknown as Record<string, string | string[]>;
    setDraft(merged);
    setRows(
      buildInitialRowsFromSource(merged, spec, defaultAttributeWhenNoRows)
    );
    setAttrSelectOpen(null);
    setValueMultiOpenRowId(null);
  }, [getEmpty, spec, defaultAttributeWhenNoRows]);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      reinitialize();
    }
    wasOpen.current = isOpen;
  }, [isOpen, reinitialize]);

  const specById = useMemo(() => {
    const m = new Map<string, ListAdvancedAttributeSpec<T>>();
    spec.forEach((s) => m.set(s.id, s));
    return m;
  }, [spec]);

  const allAttrIds = useMemo(() => spec.map((s) => s.id), [spec]);

  const nextUnusedAttribute = useCallback(
    (curRows: FilterRow[]): T | null => {
      const used = new Set(curRows.map((r) => r.attr));
      for (const id of allAttrIds) {
        if (!used.has(id)) return id;
      }
      return null;
    },
    [allAttrIds]
  );

  const setDraftKey = useCallback(
    (attr: string, v: string | string[]) => {
      setDraft((d) => ({ ...d, [attr]: v }));
    },
    []
  );

  const onAttributeSelect = (rowId: string, newAttr: T) => {
    const me = rows.find((r) => r.id === rowId);
    if (!me) return;
    const oldAttr = me.attr as T;
    if (oldAttr === newAttr) return;
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, attr: newAttr } : r)));
    setDraft((dPrev) => {
      const nextD = { ...dPrev } as Record<T, string | string[]>;
      const otherRowsStillOld = rows.filter((r) => r.id !== rowId && r.attr === oldAttr).length > 0;
      if (!otherRowsStillOld) {
        clearKeyInPlace(nextD, oldAttr);
      }
      return nextD as unknown as Record<string, string | string[]>;
    });
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => {
      const target = prev.find((r) => r.id === rowId);
      if (!target) return prev;
      const nextRows = prev.filter((r) => r.id !== rowId);
      setDraft((dPrev) => {
        const m = { ...dPrev } as Record<T, string | string[]>;
        if (!nextRows.some((r) => r.attr === target.attr)) {
          clearKeyInPlace(m, target.attr as T);
        }
        if (nextRows.length === 0) {
          return { ...getEmpty() } as unknown as Record<string, string | string[]>;
        }
        return m as unknown as Record<string, string | string[]>;
      });
      return nextRows;
    });
  };

  const addRow = () => {
    setRows((prev) => {
      const nextA = nextUnusedAttribute(prev);
      if (!nextA) return prev;
      return [...prev, { id: newRowId(), attr: nextA }];
    });
  };

  const handleSave = () => {
    onSave(mergeWithEmpty(draft, getEmpty) as unknown as Record<T, string | string[]>);
    onClose();
  };

  const canAdd = rows.length < allAttrIds.length;

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby={headerTitleId}
      aria-describedby={headerDescId}
    >
      <ModalHeader
        labelId={headerTitleId}
        descriptorId={headerDescId}
        title={title}
        description={description}
      />
      <ModalBody id={headerDescId}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          {rows.map((row, index) => {
            const aSpec = specById.get(row.attr) ?? spec[0];
            const isLast = index === rows.length - 1;
            const opts = spec.filter(
              (s) =>
                s.id === row.attr || !rows.some((r) => r.id !== row.id && r.attr === s.id)
            );
            const vKind = aSpec.valueKind;
            return (
              <Flex
                key={row.id}
                alignItems={{ default: "alignItemsFlexStart" }}
                flexWrap={{ default: "wrap" }}
                gap={{ default: "gapMd" }}
                style={{ width: "100%" }}
              >
                <div style={{ flex: "0 0 12rem", minWidth: 0, maxWidth: "100%" }}>
                  <Select
                    isOpen={attrSelectOpen === row.id}
                    onOpenChange={(open) => {
                      if (open) {
                        setValueMultiOpenRowId(null);
                        setAttrSelectOpen(row.id);
                      } else {
                        setAttrSelectOpen((cur) => (cur === row.id ? null : cur));
                      }
                    }}
                    selected={aSpec.id}
                    onSelect={(_e, v) => {
                      if (v) onAttributeSelect(row.id, v as T);
                      setAttrSelectOpen(null);
                    }}
                    toggle={(tRef) => (
                      <MenuToggle
                        ref={tRef}
                        id={`${idPrefix}-attr-${rowBaseId}-${row.id}`}
                        isFullWidth
                        icon={<FilterIcon aria-hidden />}
                        onClick={() => setAttrSelectOpen((c) => (c === row.id ? null : row.id))}
                        isExpanded={attrSelectOpen === row.id}
                        aria-label={`${aSpec.label} filter attribute row ${index + 1}`}
                      >
                        {aSpec.label}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {opts.map((o) => (
                        <SelectOption key={o.id} value={o.id}>
                          {o.label}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </div>
                <Flex
                  style={{
                    minWidth: 0,
                    flex: `1 1 ${VALUE_FIELD_MAX_WIDTH}`,
                    maxWidth: VALUE_FIELD_MAX_WIDTH,
                  }}
                >
                  {vKind === "text" && (
                    <TextInput
                      isRequired={false}
                      value={String(draft[row.attr] ?? "")}
                      onChange={(_e, v) => setDraftKey(row.attr, (v as string) ?? "")}
                      type="text"
                      placeholder={aSpec.valuePlaceholder}
                      id={`${idPrefix}-val-${rowBaseId}-${row.id}`}
                    />
                  )}
                  {vKind === "multi" && (
                    <Select
                      isOpen={valueMultiOpenRowId === row.id}
                      onOpenChange={(open) => {
                        if (open) {
                          setAttrSelectOpen(null);
                          setValueMultiOpenRowId(row.id);
                        } else {
                          setValueMultiOpenRowId((cur) => (cur === row.id ? null : cur));
                        }
                      }}
                      role="menu"
                      selected={(draft[row.attr] as string[] | undefined) ?? []}
                      onSelect={(_e, value) => {
                        const val = String(value ?? "");
                        const list = [...((draft[row.attr] as string[] | undefined) ?? [])];
                        const i = list.indexOf(val);
                        if (i >= 0) {
                          list.splice(i, 1);
                        } else {
                          list.push(val);
                        }
                        setDraftKey(row.attr, list);
                      }}
                      toggle={(tRef) => (
                        <MenuToggle
                          ref={tRef}
                          id={`${idPrefix}-multi-${rowBaseId}-${row.id}`}
                          isFullWidth
                          onClick={() =>
                            setValueMultiOpenRowId((cur) =>
                              cur === row.id ? null : row.id
                            )
                          }
                          isExpanded={valueMultiOpenRowId === row.id}
                          aria-label={`${aSpec.label}, ${aSpec.valuePlaceholder}`}
                        >
                          {formatMultiValueToggleLabel(
                            (draft[row.attr] as string[] | undefined) ?? [],
                            aSpec.options ?? [],
                            aSpec.valuePlaceholder
                          )}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        {(aSpec.options || []).map((opt) => (
                          <SelectOption
                            key={opt.value}
                            value={opt.value}
                            hasCheckbox
                            isSelected={
                              (draft[row.attr] as string[] | undefined)?.includes(
                                opt.value
                              ) ?? false
                            }
                          >
                            {opt.label}
                          </SelectOption>
                        ))}
                      </SelectList>
                    </Select>
                  )}
                </Flex>
                <Button
                  variant="plain"
                  onClick={() => removeRow(row.id)}
                  title="Remove filter row"
                  icon={<Trash2 aria-hidden />}
                />
                {isLast && canAdd ? (
                  <Button
                    variant="plain"
                    onClick={addRow}
                    title="Add filter row"
                    icon={<Plus aria-hidden />}
                  />
                ) : null}
              </Flex>
            );
          })}
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
