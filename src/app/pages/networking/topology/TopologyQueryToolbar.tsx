import {
  Button,
  Divider,
  FormGroup,
  Label,
  LabelGroup,
  MenuToggle,
  Popover,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Switch,
  TextInput,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import ArrowRightIcon from "@patternfly/react-icons/dist/esm/icons/arrow-right-icon";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import { useMemo, useState } from "react";
import {
  QUERY_FIELD_OPTIONS,
  QUERY_OPERATOR_OPTIONS,
  createQueryClause,
  parseRawQuery,
  serializeQuery,
  type QueryField,
  type QueryLogic,
  type QueryOperator,
  type TopologyQueryClause,
  type TopologyQueryState,
} from "./topologyQueryFilter";

type TopologyQueryToolbarProps = {
  queryState: TopologyQueryState;
  onQueryStateChange: (state: TopologyQueryState) => void;
  nameSearch: string;
  onNameSearchChange: (value: string) => void;
  showAdvanced: boolean;
  onShowAdvancedChange: (value: boolean) => void;
};

export function TopologyQueryToolbar({
  queryState,
  onQueryStateChange,
  nameSearch,
  onNameSearchChange,
  showAdvanced,
  onShowAdvancedChange,
}: TopologyQueryToolbarProps) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [draftField, setDraftField] = useState<QueryField>("namespace");
  const [draftOperator, setDraftOperator] = useState<QueryOperator>("equals");
  const [draftValue, setDraftValue] = useState("");
  const [fieldOpen, setFieldOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);

  const activeClauses = queryState.clauses.length > 0 ? queryState.clauses : parseRawQuery(queryState.rawQuery);

  const serialized = useMemo(() => serializeQuery(queryState), [queryState]);

  const applyRawQuery = (raw: string) => {
    onQueryStateChange({
      ...queryState,
      rawQuery: raw,
      clauses: parseRawQuery(raw),
    });
  };

  const addClause = () => {
    if (!draftValue.trim()) return;
    const nextClause = { ...createQueryClause(draftField), operator: draftOperator, value: draftValue.trim() };
    onQueryStateChange({
      logic: queryState.logic,
      rawQuery: "",
      clauses: [...queryState.clauses, nextClause],
    });
    setDraftValue("");
    setBuilderOpen(false);
  };

  const removeClause = (id: string) => {
    onQueryStateChange({
      ...queryState,
      clauses: queryState.clauses.filter((clause) => clause.id !== id),
    });
  };

  const clearAll = () => {
    onQueryStateChange({ logic: "and", clauses: [], rawQuery: "" });
    onNameSearchChange("");
  };

  const builder = (
    <div className="ocs-pf-topo-query-builder" role="group" aria-label="Add topology filter">
      <FormGroup label="Field">
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
              {QUERY_FIELD_OPTIONS.find((option) => option.id === draftField)?.label ?? "Field"}
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
    <Toolbar className="ocs-pf-topo-query-toolbar" aria-label="Topology query">
      <ToolbarContent>
        <ToolbarGroup variant="filter-group" className="ocs-pf-topo-query-toolbar__filters">
          <ToolbarItem>
            <Popover
              isVisible={builderOpen}
              shouldClose={() => setBuilderOpen(false)}
              shouldOpen={() => setBuilderOpen(true)}
              hideOnOutsideClick
              bodyContent={builder}
              headerContent="Add filter"
            >
              <Button variant={activeClauses.length > 0 ? "primary" : "secondary"} icon={<FilterIcon />}>
                Quick filters
              </Button>
            </Popover>
          </ToolbarItem>
          <ToolbarItem className="ocs-pf-topo-query-toolbar__search">
            <SearchInput
              placeholder='Add filter… e.g. namespace equals "openshift-storage"'
              value={queryState.rawQuery || nameSearch}
              onChange={(_e, value) => {
                onNameSearchChange(value);
                applyRawQuery(value);
              }}
              onClear={clearAll}
              aria-label="Topology query"
            />
            <Button
              variant="control"
              aria-label="Apply query"
              icon={<ArrowRightIcon />}
              onClick={() => applyRawQuery(queryState.rawQuery || nameSearch)}
            />
          </ToolbarItem>
          <ToolbarItem>
            <Switch
              id="topo-query-advanced"
              label="Advanced query"
              isChecked={showAdvanced}
              onChange={(_e, checked) => onShowAdvancedChange(checked)}
            />
          </ToolbarItem>
        </ToolbarGroup>
        {activeClauses.length > 0 ? (
          <ToolbarGroup>
            <ToolbarItem>
              <LabelGroup categoryName="Active filters">
                {activeClauses.map((clause) => (
                  <Label
                    key={clause.id}
                    color="blue"
                    onClose={() => removeClause(clause.id)}
                  >
                    {`${clause.field} ${clause.operator.replace("_", " ")} "${clause.value}"`}
                  </Label>
                ))}
              </LabelGroup>
            </ToolbarItem>
            <ToolbarItem>
              <Button variant="link" onClick={clearAll}>
                Clear all
              </Button>
            </ToolbarItem>
          </ToolbarGroup>
        ) : null}
        {showAdvanced && serialized ? (
          <>
            <Divider />
            <ToolbarItem>
              <span className="ocs-pf-topo-query-toolbar__raw">{serialized}</span>
            </ToolbarItem>
          </>
        ) : null}
      </ToolbarContent>
    </Toolbar>
  );
}
