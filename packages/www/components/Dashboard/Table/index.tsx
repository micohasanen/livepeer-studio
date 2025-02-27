import { Column, Row, useRowSelect, useSortBy, useTable } from "react-table";
import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import {
  useEffect,
  useMemo,
  useCallback,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import {
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Flex,
  Checkbox,
  Text,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import TableFilter, {
  FilterItem,
  Filter as TFilter,
  formatFiltersForApiRequest,
} from "./filters";
import Link from "next/link";
import Spinner from "components/Dashboard/Spinner";
import { ArrowRightIcon } from "@radix-ui/react-icons";

type Sort<T extends Record<string, unknown>> = { id: keyof T; desc: boolean };

type StateSetter<T extends Record<string, unknown>> = {
  setOrder: Dispatch<SetStateAction<string>>;
  setCursor: Dispatch<SetStateAction<string>>;
  setPrevCursors: Dispatch<SetStateAction<string[]>>;
  setNextCursor: Dispatch<SetStateAction<string>>;
  setFilters: Dispatch<SetStateAction<TFilter[]>>;
  setSelectedRows: Dispatch<SetStateAction<Row<T>[]>>;
};

type State<T extends Record<string, unknown>> = {
  tableId: string;
  order: string;
  cursor: string;
  prevCursors: string[];
  nextCursor: string;
  filters: TFilter[];
  stringifiedFilters: string;
  selectedRows: Row<T>[];
  pageSize: number;
  invalidate: () => Promise<void>;
};

export type FetchResult<T extends Record<string, unknown>> = {
  rows: T[];
  nextCursor: string;
  count: number;
};

export type Fetcher<T extends Record<string, unknown>> = (
  state: State<T>
) => Promise<FetchResult<T>>;

export type TableData<T extends Record<string, unknown>> = {
  isLoading: boolean;
  data: FetchResult<T>;
};

type Props<T extends Record<string, unknown>> = {
  columns: any;
  header: React.ReactNode;
  rowSelection?: "individual" | "all" | null;
  initialSortBy?: Sort<T>[];
  filterItems?: FilterItem[];
  showOverflow?: boolean;
  cursor?: string;
  selectAction?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  createAction?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  stateSetter: StateSetter<T>;
  state: State<T>;
  fetcher: Fetcher<T>;
  fetcherOptions?: UseQueryOptions;
  noPagination?: boolean;
  emptyState?: React.ReactNode;
  viewAll?: string;
  border?: boolean;
  tableLayout?: string;
};

type DataTableProps<T extends Record<string, unknown>> = Omit<
  Props<T>,
  "fetcher"
> & { tableData: TableData<T> };

export const DataTableComponent = <T extends Record<string, unknown>>({
  columns,
  header,
  rowSelection,
  initialSortBy,
  filterItems,
  showOverflow,
  cursor = "default",
  stateSetter,
  state,
  tableData,
  selectAction,
  createAction,
  emptyState,
  viewAll,
  noPagination = false,
  border = false,
  tableLayout = "fixed",
}: DataTableProps<T>) => {
  const { isLoading, data } = tableData;
  const dataMemo = useMemo(() => data?.rows ?? [], [data?.rows]);

  const someColumnCanSort = useMemo(() => {
    // To see if we show the sort help tooltip or not
    // @ts-ignore
    return columns.some((column) => !column.disableSortBy);
  }, [columns]);

  const getRowId = useCallback((row, relativeIndex) => {
    return row?.id ? row.id : relativeIndex;
  }, []);
  const {
    getTableProps,
    getTableBodyProps,
    prepareRow,
    headerGroups,
    rows,
    // @ts-ignore
    toggleAllRowsSelected,
    // @ts-ignore
    selectedFlatRows,
    // @ts-ignore
    state: { sortBy },
  } = useTable(
    {
      // @ts-ignore
      columns,
      getRowId,
      data: dataMemo,
      initialState: {
        // @ts-ignore
        pageSize: state.pageSize,
        pageIndex: 0,
        ...(initialSortBy ? { sortBy: initialSortBy } : undefined),
      },
      disableSortBy: !!viewAll,
      manualSortBy: false,
      autoResetFilters: false,
      autoResetSortBy: false,
      autoResetPage: false,
      autoResetSelectedRows: false,
    },
    useSortBy,
    useRowSelect,
    (hooks) => {
      if (rowSelection) {
        const isIndividualSelection = rowSelection === "individual";
        hooks.visibleColumns.push((columns) => [
          // Let's make a column for selection
          {
            id: "selection",
            // The header can use the table's getToggleAllRowsSelectedProps method
            // to render a checkbox
            Header: ({
              // @ts-ignore
              getToggleAllRowsSelectedProps,
              // @ts-ignore
              isAllRowsSelected,
            }) => {
              if (isIndividualSelection) return null;
              const props = getToggleAllRowsSelectedProps();
              return (
                <Checkbox
                  css={{ display: "flex" }}
                  onClick={props.onChange}
                  value="toggle-all"
                  checked={isAllRowsSelected ? true : false}
                />
              );
            },
            // The cell can use the individual row's getToggleRowSelectedProps method
            // to the render a checkbox
            Cell: ({ row }) => {
              return (
                <Checkbox
                  css={{ display: "flex" }}
                  // @ts-ignore
                  value={row.isSelected}
                  // @ts-ignore
                  checked={row.isSelected}
                  onClick={() => {
                    isIndividualSelection && toggleAllRowsSelected(false);
                    // @ts-ignore
                    row.toggleRowSelected(!row.isSelected);
                  }}
                />
              );
            },
          },
          ...columns,
        ]);
      }
    }
  );

  useEffect(() => {
    stateSetter.setSelectedRows(selectedFlatRows);
  }, [selectedFlatRows, stateSetter.setSelectedRows]);

  useEffect(() => {
    const order = sortBy?.map((o) => `${o.id}-${o.desc}`).join(",") ?? "";
    stateSetter.setOrder(order);
  }, [sortBy, stateSetter.setOrder]);

  useEffect(() => {
    stateSetter.setNextCursor(data?.nextCursor);
  }, [data?.nextCursor, stateSetter.setNextCursor]);

  const handlePreviousPage = useCallback(() => {
    stateSetter.setNextCursor(state.cursor); // current cursor will be next
    const prevCursorsClone = [...state.prevCursors];
    const newCursor = prevCursorsClone.pop();
    stateSetter.setCursor(newCursor);
    stateSetter.setPrevCursors([...prevCursorsClone]);
  }, [
    stateSetter.setNextCursor,
    stateSetter.setCursor,
    stateSetter.setPrevCursors,
    state.prevCursors,
    state.cursor,
  ]);

  const handleNextPage = useCallback(() => {
    stateSetter.setPrevCursors((p) => [...p, state.cursor]);
    stateSetter.setCursor(state.nextCursor);
    stateSetter.setNextCursor("");
  }, [
    stateSetter.setPrevCursors,
    stateSetter.setCursor,
    stateSetter.setNextCursor,
    state.nextCursor,
    state.cursor,
  ]);

  const onSetFilters = (e) => {
    stateSetter.setCursor("");
    stateSetter.setPrevCursors([]);
    stateSetter.setFilters(e);
  };

  return (
    <Box>
      <Flex
        align="end"
        justify="between"
        css={{
          mb: "$3",
          borderBottom: "1px solid",
          borderColor: border ? "$neutral5" : "transparent",
          pb: border ? "$2" : 0,
        }}>
        <Box>{header}</Box>
        <Flex css={{ alignItems: "center" }}>
          {state.selectedRows.length ? (
            <Flex css={{ ai: "center" }}>
              <Flex css={{ ai: "center", mr: "$3" }}>
                <Box css={{ fontSize: "$2", color: "$primary9" }}>
                  {state.selectedRows.length} selected
                </Box>
                <Box
                  css={{ height: 18, width: "1px", bc: "$primary7", mx: "$3" }}
                />
                <Box
                  css={{
                    cursor: "pointer",
                    fontSize: "$2",
                    color: "$blue11",
                  }}
                  onClick={() => toggleAllRowsSelected(false)}>
                  Deselect
                </Box>
              </Flex>
              {selectAction && (
                <Button
                  size="2"
                  // @ts-ignore
                  css={{
                    display: "flex",
                    alignItems: "center",
                  }}
                  {...selectAction}
                />
              )}
            </Flex>
          ) : (
            <>
              {!viewAll && filterItems && (
                <TableFilter
                  items={filterItems}
                  onDone={(e) => onSetFilters(e)}
                />
              )}
              {createAction && (
                <Button
                  variant="primary"
                  size="2"
                  // @ts-ignore
                  css={{ display: "flex", alignItems: "center" }}
                  {...createAction}
                />
              )}
            </>
          )}
        </Flex>
      </Flex>
      {isLoading ? (
        <Flex
          align="center"
          justify="center"
          css={{ height: "calc(100vh - 400px)" }}>
          <Spinner />
        </Flex>
      ) : !data?.count ? (
        !JSON.parse(state.stringifiedFilters).length ? (
          emptyState
        ) : (
          <Flex
            direction="column"
            justify="center"
            css={{
              margin: "0 auto",
              height: "calc(100vh - 400px)",
              maxWidth: 300,
            }}>
            <Heading css={{ fontWeight: 500, mb: "$3" }}>
              No results found
            </Heading>
            <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
              There aren't any results for that query.
            </Text>
          </Flex>
        )
      ) : (
        <Box css={{ overflow: showOverflow ? "visible" : "hidden" }}>
          <Box css={{ overflowX: showOverflow ? "visible" : "auto" }}>
            <Table {...getTableProps()}>
              <Thead>
                {headerGroups.map((headerGroup) => (
                  <Tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column, i) => {
                      const withHelpTooltip =
                        someColumnCanSort &&
                        i === headerGroup.headers.length - 1;
                      return (
                        <Td
                          as={i === 0 ? Th : Td}
                          scope="col"
                          css={{
                            pl: i === 0 ? "$1" : 0,
                            width:
                              i === 0 && rowSelection === "all"
                                ? "30px"
                                : "auto",
                          }}
                          {...column.getHeaderProps(
                            // @ts-ignore
                            column.getSortByToggleProps()
                          )}>
                          <Flex
                            css={{
                              ai: "center",
                              mr: withHelpTooltip ? "$3" : 0,
                            }}>
                            <Box css={{ fontSize: "$2", whiteSpace: "nowrap" }}>
                              {column.render("Header")}
                            </Box>
                            {/*@ts-ignore */}
                            {column.canSort && (
                              <Box css={{ ml: "$2" }}>
                                {/* @ts-ignore */}
                                {column.isSorted
                                  ? // @ts-ignore
                                    column.isSortedDesc
                                    ? " ⭣"
                                    : " ⭡"
                                  : " ⭥"}
                              </Box>
                            )}
                          </Flex>
                        </Td>
                      );
                    })}
                  </Tr>
                ))}
              </Thead>
              <Tbody {...getTableBodyProps()}>
                {rows.map((row: Row<object>) => {
                  prepareRow(row);
                  return (
                    <Tr
                      css={{
                        "&:hover": {
                          backgroundColor: "$neutral2",
                          cursor,
                        },
                      }}
                      {...row.getRowProps()}>
                      {row.cells.map((cell, i) => (
                        <Td
                          as={i === 0 ? Th : Td}
                          css={{
                            py: 0,
                            width:
                              i === 0 && rowSelection === "all"
                                ? "30px"
                                : "auto",
                            ...cell.value?.css,
                          }}
                          {...cell.getCellProps()}>
                          {cell.value?.href ? (
                            <Link href={cell.value.href} passHref>
                              <A
                                css={{
                                  textDecoration: "none",
                                  py: "$2",
                                  pl: i === 0 ? "$1" : 0,
                                  display: "block",
                                  "&:hover": {
                                    textDecoration: "none",
                                  },
                                }}>
                                {cell.render("Cell")}
                              </A>
                            </Link>
                          ) : (
                            <Box css={{ py: "$2", pl: i === 0 ? "$1" : 0 }}>
                              {cell.render("Cell")}
                            </Box>
                          )}
                        </Td>
                      ))}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
          {!noPagination && (
            <Flex justify="between" align="center" css={{ mt: "$4", p: "$1" }}>
              <Text>
                <b>{data?.count}</b> results
              </Text>
              {viewAll ? (
                <Link href={viewAll} passHref>
                  <A variant="primary" css={{ display: "flex", ai: "center" }}>
                    <Box>View all</Box> <ArrowRightIcon />
                  </A>
                </Link>
              ) : (
                <Flex>
                  <Button
                    css={{ marginRight: "6px" }}
                    onClick={handlePreviousPage}
                    disabled={state.prevCursors.length <= 0}>
                    Previous
                  </Button>
                  <Button
                    onClick={handleNextPage}
                    disabled={
                      state.nextCursor === "" ||
                      // @ts-ignore
                      state.pageSize >= parseFloat(data?.count)
                    }>
                    Next
                  </Button>
                </Flex>
              )}
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
};

export const useTableState = <T extends Record<string, unknown>>({
  tableId,
  pageSize = 20,
}: {
  tableId: string;
  pageSize?: number;
}) => {
  const [order, setOrder] = useState("");
  const [cursor, setCursor] = useState("");
  const [prevCursors, setPrevCursors] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState("default");
  const [filters, setFilters] = useState<TFilter[]>([]);
  const [selectedRows, setSelectedRows] = useState<Row<T>[]>([]);
  const queryClient = useQueryClient();

  const stringifiedFilters = useMemo(() => {
    const formatted = formatFiltersForApiRequest(filters);
    return JSON.stringify(formatted);
  }, [filters]);

  const stateSetter: StateSetter<T> = useMemo(
    () => ({
      setOrder,
      setCursor,
      setPrevCursors,
      setNextCursor,
      setFilters,
      setSelectedRows,
    }),
    []
  );

  const state: State<T> = useMemo(
    () => ({
      tableId,
      order,
      cursor,
      prevCursors,
      nextCursor,
      filters,
      stringifiedFilters,
      selectedRows,
      pageSize,
      invalidate: () => queryClient.invalidateQueries(tableId),
    }),
    [
      order,
      cursor,
      prevCursors,
      nextCursor,
      filters,
      stringifiedFilters,
      selectedRows,
      pageSize,
      queryClient,
      tableId,
    ]
  );

  return { state, stateSetter };
};

const TableComponent = <T extends Record<string, unknown>>(props: Props<T>) => {
  const { state, fetcher, fetcherOptions } = props;
  const queryKey = [
    state.tableId,
    state.cursor,
    state.order,
    state.stringifiedFilters,
  ];
  const tableData = useQuery(queryKey, () => fetcher(state));
  return DataTableComponent({ ...props, tableData });
};

export default TableComponent;
