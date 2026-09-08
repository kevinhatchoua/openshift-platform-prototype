import { useMemo, useState } from "react";
import {
  Button,
  FormGroup,
  Label,
  LabelGroup,
  MenuToggle,
  Popover,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  TextInput,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import {
  QUERY_FIELD_OPTIONS,
  QUERY_OPERATOR_OPTIONS,
  createQueryClause,
  parseRawQuery,
  type QueryField,
  type QueryLogic,
  type QueryOperator,
  type TopologyQueryClause,
  type TopologyQueryState,
} from "./topologyQueryFilter";

type TopologySearchFilterProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  queryState: TopologyQueryState;
  onQueryStateChange: (state: TopologyQueryState) => void;
};

function clauseLabel(clause: TopologyQueryClause): string {
  const field = QUERY_FIELD_OPTIONS.find((option) => option.id === clause.field)?.label ?? clause.field;
  const operator = QUERY_OPERATOR_OPTIONS.find((option) => option.id === clause.operator)?.label ?? clause.operator;
  return `${field} ${operator} "${clause.value}"`;
}

export default function TopologySearchFilter({
  searchTerm,
  onSearchTermChange,
  queryState,
  onQueryStateChange,
}: TopologySearchFilterProps) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [draftField, setDraftField] = useState<QueryField>("name");
  const [draftOperator, setDraftOperator] = useState<QueryOperator>("contains");
  const [draftValue, setDraftValue] = useState("");
  const [fieldOpen, setFieldOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);

  const activeClauses = useMemo(
    () => (queryState.clauses.length > 0 ? queryState.clauses : parseRawQuery(queryState.rawQuery)),
    [queryState]
  );

  const addClause = () => {
    if (!draftValue.trim()) return;
    onQueryStateChange({
      logic: queryState.logic,
      rawQuery: "",
      clauses: [
        ...activeClauses,
        { ...createQueryClause(draftField), operator: draftOperator, value: draftValue.trim() },
      ],
    });
    setDraftValue("");
    setBuilderOpen(false);
  };

  const removeClause = (id: string) => {
    onQueryStateChange({
      ...queryState,
      rawQuery: "",
      clauses: activeClauses.filter((clause) => clause.id !== id),
    });
  };

  const clearAdvanced = () => {
    onQueryStateChange({ logic: "and", clauses: [], rawQuery: "" });
  };

  const builder = (
    <div className="ocs-pf-topo-query-builder" role="group" aria-label="Add topology search filter">
      <FormGroup label="Attribute">
        <Select
          isOpen={fieldOpen}
          selected={draftField}
          onSelect={(_e, value) => {
            setDraftField(value as QueryField);
            setFieldOpen(false);
          }}
          onOpenChange={setFieldOpen}
          toggle={(toggleRef) => (
            <MenuToggle ref={toggleRef} onClick={() => setFieldOpen((open) => !open)} isExpanded={fieldOpen}>
              {QUERY_FIELD_OPTIONS.find((option) => option.id === draftField)?.label ?? "Attribute"}
            </MenuToggle>
          )}
        >
          <SelectList>
            {QUERY_FIELD_OPTIONS.map((option) => (
              <SelectOption key={option.id} value={option.id}>
                {option.indexed ? <strong>{option.label}</strong> : option.label}
              </SelectOption>
            ))}
          </SelectList>
        </Select>
      </FormGroup>
      <FormGroup label="Operator">
        <Select
          isOpen={operatorOpen}
          selected={draftOperator}
          onSelect={(_e, value) => {
            setDraftOperator(value as QueryOperator);
            setOperatorOpen(false);
          }}
          onOpenChange={setOperatorOpen}
          toggle={(toggleRef) => (
            <MenuToggle ref={toggleRef} onClick={() => setOperatorOpen((open) => !open)} isExpanded={operatorOpen}>
              {QUERY_OPERATOR_OPTIONS.find((option) => option.id === draftOperator)?.label ?? "Operator"}
            </MenuToggle>
          )}
        >
          <SelectList>
            {QUERY_OPERATOR_OPTIONS.map((option) => (
              <SelectOption key={option.id} value={option.id}>
                {option.label}
              </SelectOption>
            ))}
          </SelectList>
        </Select>
      </FormGroup>
      <FormGroup label="Value">
        <TextInput
          value={draftValue}
          onChange={(_e, value) => setDraftValue(value)}
          aria-label="Filter value"
          placeholder='e.g. "openshift-storage"'
        />
      </FormGroup>
      <ToggleGroup aria-label="Combine filters" isCompact>
        {(["and", "or"] as QueryLogic[]).map((logic) => (
          <ToggleGroupItem
            key={logic}
            text={logic.toUpperCase()}
            isSelected={queryState.logic === logic}
            onChange={() => onQueryStateChange({ ...queryState, logic })}
          />
        ))}
      </ToggleGroup>
      <Button variant="primary" onClick={addClause}>
        Add filter
      </Button>
    </div>
  );

  return (
    <div className="ocs-pf-topo-search-filter">
      <SearchInput
        className="ocs-net-topo-panel__search"
        placeholder="Search topology..."
        value={searchTerm}
        onChange={(_e, value) => onSearchTermChange(value)}
        onClear={() => onSearchTermChange("")}
        aria-label="Search topology resources"
      />
      <Popover
        isVisible={builderOpen}
        shouldClose={() => setBuilderOpen(false)}
        shouldOpen={() => setBuilderOpen(true)}
        hideOnOutsideClick
        bodyContent={builder}
        headerContent="Advanced filter"
      >
        <Button
          variant={activeClauses.length > 0 ? "primary" : "control"}
          icon={<FilterIcon />}
          aria-label="Advanced topology filters"
        >
          Advanced
        </Button>
      </Popover>
      {activeClauses.length > 0 ? (
        <LabelGroup categoryName="Filters">
          {activeClauses.map((clause) => (
            <Label key={clause.id} color="blue" onClose={() => removeClause(clause.id)}>
              {clauseLabel(clause)}
            </Label>
          ))}
          <Button variant="link" isInline onClick={clearAdvanced}>
            Clear filters
          </Button>
        </LabelGroup>
      ) : null}
    </div>
  );
}
