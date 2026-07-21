import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Button,
  Checkbox,
  Flex,
  FlexItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Title,
  ToolbarItem,
} from "@patternfly/react-core";
import { Columns2 } from "@/lib/pfIcons";

export type ManageColumnDef<K extends string> = {
  id: K;
  label: string;
  /** Shown under "Default columns" (and on by default when restore is used). */
  isDefault?: boolean;
  /** Always visible; checkbox disabled. */
  isLocked?: boolean;
};

const rowStyle = (withDivider: boolean): CSSProperties => ({
  paddingBlock: "var(--pf-t--global--spacer--sm)",
  ...(withDivider
    ? { borderBottom: "1px solid var(--pf-t--global--border--color--default)" }
    : {}),
});

export function defaultVisibilityMap<K extends string>(
  columns: ManageColumnDef<K>[]
): Record<K, boolean> {
  return Object.fromEntries(
    columns.map((col) => [col.id, Boolean(col.isLocked || col.isDefault)])
  ) as Record<K, boolean>;
}

export function useManageColumns<K extends string>(columns: ManageColumnDef<K>[]) {
  const defaults = useMemo(() => defaultVisibilityMap(columns), [columns]);
  const [visibleColumns, setVisibleColumns] = useState<Record<K, boolean>>(() => ({ ...defaults }));
  const [draft, setDraft] = useState<Record<K, boolean>>(() => ({ ...defaults }));
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    setDraft({ ...visibleColumns });
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);
  const save = () => {
    setVisibleColumns({ ...draft });
    setIsOpen(false);
  };
  const restoreDefaults = () => setDraft({ ...defaults });

  const visibleOrderedColumns = useMemo(
    () => columns.filter((col) => col.isLocked || visibleColumns[col.id]),
    [columns, visibleColumns]
  );

  const toggleDraft = (id: K, checked: boolean) => {
    const col = columns.find((c) => c.id === id);
    if (col?.isLocked) return;
    setDraft((d) => ({ ...d, [id]: checked }));
  };

  return {
    visibleColumns,
    visibleOrderedColumns,
    isOpen,
    draft,
    open,
    close,
    save,
    restoreDefaults,
    toggleDraft,
    manageColumnsButton: (
      <ToolbarItem>
        <Button
          variant="plain"
          title="Manage columns"
          aria-label="Manage columns"
          onClick={open}
          icon={<Columns2 aria-hidden />}
        />
      </ToolbarItem>
    ) as ReactNode,
    manageColumnsModal: (
      <ManageColumnsModal
        columns={columns}
        isOpen={isOpen}
        draft={draft}
        onToggle={toggleDraft}
        onSave={save}
        onRestore={restoreDefaults}
        onClose={close}
      />
    ) as ReactNode,
  };
}

export function ManageColumnsModal<K extends string>({
  columns,
  isOpen,
  draft,
  onToggle,
  onSave,
  onRestore,
  onClose,
  description = "Selected columns will appear in the table.",
  titleId = "manage-columns-title",
  bodyId = "manage-columns-body",
}: {
  columns: ManageColumnDef<K>[];
  isOpen: boolean;
  draft: Record<K, boolean>;
  onToggle: (id: K, checked: boolean) => void;
  onSave: () => void;
  onRestore: () => void;
  onClose: () => void;
  description?: string;
  titleId?: string;
  bodyId?: string;
}) {
  const locked = columns.filter((c) => c.isLocked);
  const defaults = columns.filter((c) => !c.isLocked && c.isDefault);
  const additional = columns.filter((c) => !c.isLocked && !c.isDefault);

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      <ModalHeader labelId={titleId} descriptorId={bodyId} title="Manage columns" description={description} />
      <ModalBody id={bodyId}>
        <Flex
          direction={{ default: "column", md: "row" }}
          gap={{ default: "gap2xl" }}
          alignItems={{ default: "alignItemsStretch" }}
        >
          <FlexItem grow={{ default: "grow" }} style={{ minWidth: 0, flex: 1 }}>
            <Title headingLevel="h3" size="md" className="pf-v6-u-mb-md">
              Default columns
            </Title>
            {[...locked, ...defaults].map((col, i, arr) => (
              <div key={col.id} style={rowStyle(i < arr.length - 1)}>
                <Checkbox
                  id={`manage-col-${String(col.id)}`}
                  label={col.label}
                  isChecked={col.isLocked ? true : draft[col.id]}
                  isDisabled={Boolean(col.isLocked)}
                  onChange={(_e, checked) => onToggle(col.id, Boolean(checked))}
                />
              </div>
            ))}
          </FlexItem>
          {additional.length > 0 ? (
            <FlexItem grow={{ default: "grow" }} style={{ minWidth: 0, flex: 1 }}>
              <Title headingLevel="h3" size="md" className="pf-v6-u-mb-md">
                Additional columns
              </Title>
              {additional.map((col, i) => (
                <div key={col.id} style={rowStyle(i < additional.length - 1)}>
                  <Checkbox
                    id={`manage-col-${String(col.id)}`}
                    label={col.label}
                    isChecked={draft[col.id]}
                    onChange={(_e, checked) => onToggle(col.id, Boolean(checked))}
                  />
                </div>
              ))}
            </FlexItem>
          ) : null}
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Flex
          flexWrap={{ default: "wrap" }}
          alignItems={{ default: "alignItemsCenter" }}
          gap={{ default: "gapMd" }}
        >
          <Button variant="primary" onClick={onSave}>
            Save
          </Button>
          <Button variant="secondary" onClick={onRestore}>
            Restore default columns
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </Flex>
      </ModalFooter>
    </Modal>
  );
}
