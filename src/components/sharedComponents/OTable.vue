<script setup>
import { computed, ref, watch } from "vue";
import OScrollObserver from "./OScrollObserver.vue";
import OMenu from "./OMenu.vue";
import OCheckbox from "./OCheckbox.vue";

/**
 * BasicTable - A clean and reliable table component with horizontal/vertical scrolling
 */
const emits = defineEmits([
  "cellClicked",
  "scrolledToEndInTable",
  "onSort",
  "onFilter",
  "onSelect",
]);

const props = defineProps({
  /**
   * Array of header objects that define the table columns
   * @example [{ text: "Name", key: "name", width: "2fr", headerClasses: "left-align", classes: "left-align", sortable: true }]
   */
  headers: {
    type: Array,
    required: true,
    default: () => [],
  },

  /**
   * Array of data objects to be displayed in the table
   * Each object should have keys matching the header keys
   */
  tableData: {
    type: Array,
    required: true,
    default: () => [],
  },

  /**
   * Enables or disables the hover effect on table rows
   */
  enableHover: {
    type: Boolean,
    default: true,
  },

  /**
   * Enables or disables the infinite scroll functionality
   */
  enableInfiniteScroll: {
    type: Boolean,
    default: true,
  },

  /**
   * Default width for table cells
   */
  defaultCellWidth: {
    type: String,
    default: "1fr",
  },

  /**
   * If true, all user actions (sort, filter) will be emitted for parent handling
   * If false, actions will be handled internally
   */
  async: {
    type: Boolean,
    default: false,
  },

  /**
   * Sort state from parent (can be updated dynamically)
   * @example { sortBy: 'productName', sortOrder: 'asc' }
   */
  sort: {
    type: Object,
    default: () => null,
  },

  /**
   * Filter state from parent (can be updated dynamically)
   * @example { productName: ['value1', 'value2'], category: ['cat1'] }
   */
  filters: {
    type: Object,
    default: () => ({}),
  },

  /**
   * Enable row selection with checkboxes
   */
  allowSelect: {
    type: Boolean,
    default: false,
  },

  /**
   * Selected rows from parent (can be updated dynamically)
   * @example [{ id: '1', ... }, { id: '2', ... }]
   */
  selected: {
    type: Array,
    default: () => [],
  },

  /**
   * Key to use for row identification (default: 'id')
   */
  rowKey: {
    type: String,
    default: "_id",
  },
});

// Sort state
const sortState = ref({
  sortBy: props.sort?.sortBy || null,
  sortOrder: props.sort?.sortOrder || null, // 'asc' | 'desc' | null
});

// Filter state - track selected filter values per header key
// Format: { headerKey: [selectedValues], ... }
const filterState = ref({ ...props.filters });
const openFilterMenu = ref(null); // Track which header's filter menu is open
const filterMenuRefs = ref({}); // Refs for OMenu components

// Selection state - track selected rows
const selectedRows = ref([...props.selected]);

/**
 * Computed: Get display data based on async mode
 * If async: false, handle sorting and filtering internally
 * If async: true, parent handles it, just return tableData
 */
const displayData = computed(() => {
  // If async mode, parent handles sorting/filtering - just return tableData
  if (props.async) {
    return props.tableData;
  }

  // Internal mode: handle sorting and filtering
  let data = [...props.tableData];

  // Internal sorting
  if (sortState.value.sortBy) {
    data = data.sort((a, b) => {
      let aValue = a[sortState.value.sortBy];
      let bValue = b[sortState.value.sortBy];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      // Check if both values are numbers (including string numbers)
      const aIsNumber = !isNaN(aValue) && aValue !== "";
      const bIsNumber = !isNaN(bValue) && bValue !== "";

      if (aIsNumber && bIsNumber) {
        // Numerical comparison
        return sortState.value.sortOrder === "asc"
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      } else {
        // String comparison (case-insensitive)
        const comparison = String(aValue)
          .toLowerCase()
          .localeCompare(String(bValue).toLowerCase());
        return sortState.value.sortOrder === "asc" ? comparison : -comparison;
      }
    });
  }

  // Internal filtering
  const activeFilters = Object.keys(filterState.value).filter(
    (key) =>
      filterState.value[key] &&
      Array.isArray(filterState.value[key]) &&
      filterState.value[key].length > 0
  );
  if (activeFilters.length > 0) {
    data = data.filter((row) => {
      return activeFilters.every((filterKey) => {
        const filterValues = filterState.value[filterKey];
        const rowValue = row[filterKey];
        return filterValues.includes(rowValue);
      });
    });
  }

  return data;
});

/**
 * Handles cell click events and emits data
 */
const handleCellClick = (rowData, cell) => {
  emits("cellClicked", rowData, cell);
};

/**
 * Handles reaching the end of the table for infinite scroll
 */
const handleLoadMoreData = () => {
  emits("scrolledToEndInTable");
};

/**
 * Handles header click for sorting
 */
const handleSort = (header) => {
  if (!header.sortable) return;

  let newSortOrder = "asc";

  // If clicking the same header, toggle between asc, desc, and none
  if (sortState.value.sortBy === header.key) {
    if (sortState.value.sortOrder === "asc") {
      newSortOrder = "desc";
    } else if (sortState.value.sortOrder === "desc") {
      // Reset to no sort
      sortState.value.sortBy = null;
      sortState.value.sortOrder = null;

      // Emit only in async mode
      if (props.async) {
        emits("onSort", {
          header,
          sortBy: null,
          sortOrder: null,
        });
      }
      return;
    }
  }

  sortState.value.sortBy = header.key;
  sortState.value.sortOrder = newSortOrder;

  // Emit only in async mode
  if (props.async) {
    emits("onSort", {
      header,
      sortBy: header.key,
      sortOrder: newSortOrder,
    });
  }
};

/**
 * Get sort icon state for a header
 */
const getSortIconState = (header) => {
  if (!header.sortable) return null;
  if (sortState.value.sortBy !== header.key) return "none";
  return sortState.value.sortOrder; // 'asc' | 'desc'
};

/**
 * Check if header has filter enabled
 */
const hasFilter = (header) => {
  return header.filterable === true;
};

/**
 * Check if filter is active for a header
 */
const isFilterActive = (header) => {
  const filterValues = filterState.value[header.key];
  return filterValues && Array.isArray(filterValues) && filterValues.length > 0;
};

/**
 * Get selected filter values for a header
 */
const getSelectedFilterValues = (header) => {
  return filterState.value[header.key] || [];
};

/**
 * Check if a filter option is selected
 */
const isFilterOptionSelected = (header, optionValue) => {
  const selectedValues = getSelectedFilterValues(header);
  return selectedValues.includes(optionValue);
};

/**
 * Toggle filter menu
 */
const toggleFilterMenu = (header) => {
  if (filterMenuRefs.value[header.key]) {
    filterMenuRefs.value[header.key].toggleMenu();
  }
};

/**
 * Handle filter menu open
 */
const handleFilterMenuOpen = (header) => {
  openFilterMenu.value = header.key;
};

/**
 * Handle filter menu close
 */
const handleFilterMenuClose = (header) => {
  if (openFilterMenu.value === header.key) {
    openFilterMenu.value = null;
  }
};

/**
 * Close filter menu
 */
const closeFilterMenu = (header) => {
  if (header && filterMenuRefs.value[header.key]) {
    filterMenuRefs.value[header.key].closeMenu();
  } else {
    // Close all menus
    Object.values(filterMenuRefs.value).forEach((menuRef) => {
      if (menuRef) {
        menuRef.closeMenu();
      }
    });
    openFilterMenu.value = null;
  }
};

/**
 * Handle filter option toggle
 */
const handleFilterOptionToggle = (header, optionValue) => {
  const currentValues = getSelectedFilterValues(header);
  let newValues;

  if (currentValues.includes(optionValue)) {
    // Remove if already selected
    newValues = currentValues.filter((val) => val !== optionValue);
  } else {
    // Add if not selected
    newValues = [...currentValues, optionValue];
  }

  // Update filter state
  if (newValues.length > 0) {
    filterState.value[header.key] = newValues;
  } else {
    delete filterState.value[header.key];
  }

  // Emit filter change only in async mode
  if (props.async) {
    emits("onFilter", {
      ...filterState.value,
    });
  }
};

/**
 * Handle filter values change from OCheckbox
 * Format: { headerKey: [selectedValues], ... }
 * Example: { category: ['Furniture', 'Seating'], material: ['Oak Wood'] }
 */
const handleFilterValuesChange = (header, newValues) => {
  // Update filter state - header.key as object key, values as array
  if (newValues && Array.isArray(newValues) && newValues.length > 0) {
    filterState.value[header.key] = newValues;
  } else {
    // Remove the key if no values selected
    delete filterState.value[header.key];
  }

  // Emit filter change only in async mode
  if (props.async) {
    const allFilters = { ...filterState.value };
    emits("onFilter", allFilters);
  }
};

/**
 * Clear all filters for a header
 */
const clearHeaderFilters = (header) => {
  delete filterState.value[header.key];
  // Emit updated filter state only in async mode
  if (props.async) {
    emits("onFilter", {
      ...filterState.value,
    });
  }
};

/**
 * Compute grid template columns based on header widths
 * If allowSelect is true, add checkbox column at the start
 */
const gridTemplate = computed(() => {
  const headerWidths = props.headers.map(
    (h) => h.width || props.defaultCellWidth
  );
  if (props.allowSelect) {
    return ["auto", ...headerWidths].join(" ");
  }
  return headerWidths.join(" ");
});

/**
 * Get row identifier
 */
const getRowId = (rowData) => {
  return rowData[props.rowKey] || rowData.id || null;
};

/**
 * Check if row is selected
 */
const isRowSelected = (rowData) => {
  const rowId = getRowId(rowData);
  if (!rowId) return false;
  return selectedRows.value.some((selected) => {
    const selectedId =
      typeof selected === "object"
        ? selected[props.rowKey] || selected.id
        : selected;
    return selectedId === rowId;
  });
};

/**
 * Check if all rows are selected
 */
const isAllSelected = computed(() => {
  if (!props.allowSelect || props.tableData.length === 0) return false;
  return props.tableData.every((row) => isRowSelected(row));
});

/**
 * Check if some rows are selected (indeterminate state)
 */
const isIndeterminate = computed(() => {
  if (!props.allowSelect || props.tableData.length === 0) return false;
  const selectedCount = props.tableData.filter((row) =>
    isRowSelected(row)
  ).length;
  return selectedCount > 0 && selectedCount < props.tableData.length;
});

/**
 * Handle select all toggle
 */
const handleSelectAll = () => {
  if (isAllSelected.value) {
    // Deselect all
    selectedRows.value = [];
  } else {
    // Select all
    selectedRows.value = props.tableData.map((row) => {
      const rowId = getRowId(row);
      return rowId ? row : { [props.rowKey]: rowId, ...row };
    });
  }
  emits("onSelect", selectedRows.value);
};

/**
 * Handle individual row selection
 */
const handleRowSelect = (rowData, newValues) => {
  const rowId = getRowId(rowData);
  if (!rowId) return;

  // If OCheckbox passed new values, use them
  if (Array.isArray(newValues)) {
    selectedRows.value = newValues;
  } else {
    // Manual toggle
    const isSelected = isRowSelected(rowData);
    if (isSelected) {
      // Remove from selection
      selectedRows.value = selectedRows.value.filter((selected) => {
        const selectedId =
          typeof selected === "object"
            ? selected[props.rowKey] || selected.id
            : selected;
        return selectedId !== rowId;
      });
    } else {
      // Add to selection
      selectedRows.value = [...selectedRows.value, rowData];
    }
  }
  emits("onSelect", selectedRows.value);
};

/**
 * Watch for external sort changes
 */
watch(
  () => props.sort,
  (newSort) => {
    if (newSort) {
      sortState.value.sortBy = newSort.sortBy;
      sortState.value.sortOrder = newSort.sortOrder;
    } else {
      sortState.value.sortBy = null;
      sortState.value.sortOrder = null;
    }
  },
  { deep: true, immediate: true }
);

/**
 * Watch for external filter changes
 */
watch(
  () => props.filters,
  (newFilters) => {
    filterState.value = { ...newFilters };
  },
  { deep: true, immediate: true }
);

/**
 * Watch for external selected rows changes
 */
watch(
  () => props.selected,
  (newSelected) => {
    selectedRows.value = [...newSelected];
  },
  { deep: true, immediate: true }
);

// OMenu handles all positioning, teleporting, and click outside logic internally
</script>

<template>
  <div class="basic-table-wrapper">
    <div class="basic-table-scroll-container">
      <div class="basic-table-content">
        <!-- Table Header - Sticky -->
        <div
          class="table-header"
          :style="{ gridTemplateColumns: gridTemplate }"
        >
          <!-- Checkbox column header -->
          <div
            v-if="allowSelect"
            class="table-header-cell checkbox-header-cell"
            @click.stop="handleSelectAll"
          >
            <OCheckbox
              :value="'selectAll'"
              :model-value="selectedRows"
              :all-items="tableData"
              :value-key="rowKey"
              size="sm"
              @update:model-value="(values) => handleSelectAll(values)"
            />
          </div>
          <div
            v-for="(header, index) in headers"
            :key="`header-${index}`"
            class="table-header-cell"
            :class="[
              header.headerClasses,
              {
                sortable: header.sortable,
                'sorted-asc':
                  sortState.sortBy === header.key &&
                  sortState.sortOrder === 'asc',
                'sorted-desc':
                  sortState.sortBy === header.key &&
                  sortState.sortOrder === 'desc',
              },
            ]"
            @click="header.sortable && handleSort(header)"
          >
            <slot
              :name="`header-${header.key}`"
              :header="header"
              :sortState="sortState"
              :filterState="filterState"
            >
              <div class="header-content">
                <span class="header-text">{{ header.text }}</span>
                <div class="header-actions">
                  <span
                    v-if="header.sortable"
                    class="sort-icon"
                    :class="{
                      'sort-none':
                        getSortIconState(header) === 'none' ||
                        getSortIconState(header) === null,
                      'sort-asc': getSortIconState(header) === 'asc',
                      'sort-desc': getSortIconState(header) === 'desc',
                    }"
                    @click.stop="handleSort(header)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        class="sort-arrow-up"
                        d="M2 10.6665L4.66667 13.3332M4.66667 13.3332L7.33333 10.6665M4.66667 13.3332V2.6665"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        class="sort-arrow-down"
                        d="M14 5.33317L11.3333 2.6665M11.3333 2.6665L8.66667 5.33317M11.3333 2.6665V13.3332"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                  <OMenu
                    v-if="hasFilter(header)"
                    :ref="(el) => (filterMenuRefs[header.key] = el)"
                    :placement="'bottom-end'"
                    :offset="[0, 0.5]"
                    :match-trigger-width="false"
                    :width="'10rem'"
                    :menu-content-class="['filter-menu-wrapper']"
                    :close-on-outside-click="true"
                    :close-on-esc="true"
                    @open="handleFilterMenuOpen(header)"
                    @close="handleFilterMenuClose(header)"
                  >
                    <template #trigger>
                      <span
                        class="filter-icon"
                        :class="{ 'filter-active': isFilterActive(header) }"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15"
                          height="13"
                          viewBox="0 0 15 13"
                          fill="none"
                        >
                          <path
                            d="M13.8333 0.5H0.5L5.83333 6.80667V11.1667L8.5 12.5V6.80667L13.8333 0.5Z"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </span>
                    </template>
                    <template #content>
                      <slot
                        :name="`filter-${header.key}`"
                        :header="header"
                        :selectedValues="getSelectedFilterValues(header)"
                        :onFilterToggle="
                          (value) => handleFilterOptionToggle(header, value)
                        "
                        :isOptionSelected="
                          (value) => isFilterOptionSelected(header, value)
                        "
                        :clearFilters="() => clearHeaderFilters(header)"
                        :closeMenu="() => closeFilterMenu(header)"
                      >
                        <div class="filter-menu-content">
                          <div class="filter-menu-body">
                            <div
                              v-if="
                                header.filter &&
                                Array.isArray(header.filter) &&
                                header.filter.length > 0
                              "
                            >
                              <OCheckbox
                                v-for="(option, index) in header.filter"
                                :key="index"
                                :value="option.value"
                                :label="option.text"
                                :model-value="getSelectedFilterValues(header)"
                                size="sm"
                                @update:model-value="
                                  (values) =>
                                    handleFilterValuesChange(header, values)
                                "
                                class="filter-checkbox-item"
                              />
                            </div>
                            <p v-else class="no-filters-text">
                              No filter options available
                            </p>
                            <button
                              v-if="isFilterActive(header)"
                              @click.stop="clearHeaderFilters(header)"
                              class="clear-all-btn"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                      </slot>
                    </template>
                  </OMenu>
                </div>
              </div>
            </slot>
          </div>
        </div>

        <!-- Table Body -->
        <div class="table-body">
          <div
            v-for="(rowData, rowIndex) in displayData"
            :key="getRowId(rowData) || `row-${rowIndex}`"
            class="table-row"
            :class="{ 'hover-enabled': enableHover }"
            :style="{ gridTemplateColumns: gridTemplate }"
          >
            <!-- Checkbox column cell -->
            <div
              v-if="allowSelect"
              class="table-cell checkbox-cell"
              @click.stop
            >
              <OCheckbox
                :value="getRowId(rowData)"
                :model-value="selectedRows"
                :value-key="rowKey"
                size="sm"
                @update:model-value="
                  (values) => handleRowSelect(rowData, values)
                "
              />
            </div>
            <div
              v-for="(header, cellIndex) in headers"
              :key="`cell-${rowIndex}-${cellIndex}`"
              class="table-cell"
              :class="[
                header.classes,
                { 'first-data-cell': allowSelect && cellIndex === 0 },
              ]"
              @click="handleCellClick(rowData, header)"
            >
              <slot
                :name="`cell-${header.key}`"
                :rowData="rowData"
                :cell="header"
              >
                <div class="cell-content">
                  <template
                    v-if="header.render && typeof header.render === 'function'"
                  >
                    {{ header.render(rowData) }}
                  </template>
                  <template v-else>
                    {{
                      rowData[header.key] !== undefined
                        ? rowData[header.key]
                        : "-"
                    }}
                  </template>
                </div>
              </slot>
            </div>
          </div>

          <!-- Infinite Scroll Observer -->
          <OScrollObserver
            v-if="enableInfiniteScroll"
            @scrolledToEnd="handleLoadMoreData"
          />
        </div>
      </div>
    </div>
    <!-- Table Footer - Outside scroll container -->
    <slot name="footer"></slot>
  </div>
</template>

<style lang="scss" scoped>
.basic-table-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 0.0625rem solid #e5e7eb;
  // border-radius: 0.5rem;

  .basic-table-scroll-container {
    width: 100%;
    flex: 1;
    overflow: auto;
    position: relative;
    min-height: 0;

    .basic-table-content {
      min-width: 100%;
      min-height: 100%;
      width: max-content;
      display: flex;
      flex-direction: column;
    }
  }

  // Table Header - Sticky
  .table-header {
    display: grid;
    align-items: stretch;
    position: sticky;
    top: 0;

    background: #f3f4f6;
    border-bottom: 0.0625rem solid #e5e7eb;
    z-index: 1;

    .table-header-cell {
      padding: 0.75rem 1rem;
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
        Roboto, sans-serif;
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-right: 0.0625rem solid #e5e7eb;
      user-select: none;
      display: flex;
      align-items: center;
      height: 100%;

      &:last-child {
        border-right: none;
      }

      &.sortable {
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        position: relative;

        .header-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-shrink: 0;
        }

        .sort-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 1rem;
          height: 1rem;
          color: #6b7280;
          transition: color 0.2s ease;
          cursor: pointer;

          &:hover {
            color: #3b82f6;
          }

          svg {
            width: 100%;
            height: 100%;
          }

          // Default state - show both arrows
          &.sort-none {
            .sort-arrow-up,
            .sort-arrow-down {
              opacity: 0.5;
            }
          }

          // Ascending sort - show only up arrow, highlight it
          &.sort-asc {
            color: #3b82f6;

            .sort-arrow-up {
              opacity: 1;
            }

            .sort-arrow-down {
              opacity: 0.3;
            }
          }

          // Descending sort - show only down arrow, highlight it
          &.sort-desc {
            color: #3b82f6;

            .sort-arrow-up {
              opacity: 0.3;
            }

            .sort-arrow-down {
              opacity: 1;
            }
          }

          .sort-arrow-up,
          .sort-arrow-down {
            transition: opacity 0.2s ease;
          }
        }

        .filter-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 0.9375rem;
          height: 0.8125rem;
          color: #9ca3af;
          transition: color 0.2s ease;
          cursor: pointer;
          position: relative;

          &:hover {
            color: #3b82f6;
          }

          &.filter-active {
            color: #2563eb;

            &::after {
              content: "";
              position: absolute;
              top: -0.125rem;
              right: -0.125rem;
              width: 0.375rem;
              height: 0.375rem;
              background: #2563eb;
              border-radius: 50%;
              border: 0.125rem solid #ffffff;
            }
          }

          svg {
            width: 100%;
            height: 100%;
          }
        }
      }

      &.sorted-asc .sort-icon,
      &.sorted-desc .sort-icon {
        color: #3b82f6;
      }

      &.left-align {
        text-align: left;

        .header-content {
          justify-content: flex-start;
        }
      }

      &.center-align {
        text-align: center;

        .header-content {
          justify-content: center;
        }
      }

      &.right-align {
        text-align: right;

        .header-content {
          justify-content: flex-end;
        }
      }

      &.checkbox-header-cell {
        padding: 0.75rem 0.5rem;
        padding-right: 0.5rem;
        border-right: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &.first-data-header {
        padding-left: 0.5rem;
      }
    }
  }

  // Table Body
  .table-body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;

    .table-row {
      display: grid;
      align-items: stretch;
      border-bottom: 0.0625rem solid #e5e7eb;
      transition: background-color 0.2s ease;

      &.hover-enabled:hover {
        background-color: #f9fafb;
        cursor: pointer;
      }

      .table-cell {
        padding: 0.75rem 1rem;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
          Roboto, sans-serif;
        font-size: 0.75rem;
        font-style: normal;
        font-weight: 500;
        color: #374151;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-right: 0.0625rem solid #e5e7eb;
        display: flex;
        align-items: center;
        height: 100%;
        min-height: 100%;

        &:last-child {
          border-right: none;
        }

        .cell-content {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
          display: flex;
          align-items: center;
        }

        &.left-align {
          text-align: left;
          justify-content: flex-start;

          .cell-content {
            justify-content: flex-start;
          }
        }

        &.center-align {
          text-align: center;
          justify-content: center;

          .cell-content {
            justify-content: center;
          }
        }

        &.right-align {
          text-align: right;
          justify-content: flex-end;

          .cell-content {
            justify-content: flex-end;
          }
        }

        &.checkbox-cell {
          padding: 0.75rem 0.5rem;
          padding-right: 0.5rem;
          border-right: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        &.first-data-cell {
          padding-left: 0.5rem;
        }
      }
    }
  }

  // Custom Scrollbar Styling
  .basic-table-scroll-container::-webkit-scrollbar {
    width: 0.5rem;
    height: 0.5rem;
  }

  .basic-table-scroll-container::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 0.25rem;
  }

  .basic-table-scroll-container::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 0.25rem;
    transition: background 0.2s ease;

    &:hover {
      background: #374151;
    }
  }

  .basic-table-scroll-container::-webkit-scrollbar-corner {
    background: #f3f4f6;
  }
}
</style>

<style lang="scss">
// Non-scoped styles for filter menu content (teleported to body via OMenu)
.filter-menu-wrapper {
  border-radius: 0.5rem !important;
  overflow: hidden;
  background: #ffffff !important;
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
}

.filter-menu-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 15rem;
  overflow: hidden;
  background: #f3f4f6;

  .filter-menu-body {
    padding: 0.5rem;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    line-height: 1.3;
    overflow-y: auto;
    max-height: 15rem;
    background: #ffffff;

    .filter-checkbox-item {
      padding: 0.5rem;
      border-radius: 0.25rem;
      transition: background-color 0.2s ease;

      &:hover {
        background: #f9fafb;
      }
    }

    .no-filters-text {
      padding: 0.5rem;
      text-align: center;
      color: #6b7280;
      font-size: 0.75rem;
      margin: 0;
    }

    .clear-all-btn {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.5rem;
      border: 0.0625rem solid #e5e7eb;
      border-radius: 0.25rem;
      background: #ffffff;
      color: #3b82f6;
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
        Roboto, sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f9fafb;
        border-color: #2563eb;
        color: #2563eb;
      }
    }
  }
}
</style>
