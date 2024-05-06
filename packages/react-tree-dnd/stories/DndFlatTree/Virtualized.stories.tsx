import * as React from 'react';
import {
  TreeItemLayout,
  FlatTree,
  flattenTree_unstable,
  HeadlessFlatTreeItemProps,
  FlatTreeItemProps,
  makeStyles,
  mergeClasses,
  useMergedRefs,
  FlatTreeItem,
  HeadlessFlatTreeItem,
  TreeNavigationEvent_unstable,
  useEventCallback,
  TreeNavigationData_unstable,
  TreeItemValue,
} from '@fluentui/react-components';
import { DndContext } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { VirtualItem, useVirtualizer } from '@tanstack/react-virtual';

import { TreeClass } from '../utils/treeHelper';

import {
  useSortableTreeItemProps,
  useHeadlessDndFlatTree,
  DragEndState,
  useDndContextProps,
  DndFlatTreeDragOverlay,
  HeadlessDndFlatTree,
  useTypeSafeSortable,
} from '@fluentui-contrib/react-tree-dnd';

type NestedItemProps = HeadlessFlatTreeItemProps & {
  subtree?: NestedItemProps[];
};

const defaultItemsNested: NestedItemProps[] = [
  {
    value: 'folder 0',
    children: <TreeItemLayout>{`folder 0`}</TreeItemLayout>,
    itemType: 'branch',
    subtree: Array.from({ length: 20 }, (_, i) => ({
      value: `folder 0 child ${i}`,
      children: <TreeItemLayout>{`folder 0 child ${i}`}</TreeItemLayout>,
      itemType: 'leaf',
    })),
  },
  {
    value: 'folder 1',
    children: <TreeItemLayout>{`folder 1`}</TreeItemLayout>,
    itemType: 'branch',
    subtree: [
      ...Array.from({ length: 20 }, (_, i) => ({
        value: `folder 1 sub-folder ${i}`,
        children: <TreeItemLayout>{`folder 1 sub-folder ${i}`}</TreeItemLayout>,
        itemType: 'branch' as const,
        subtree: Array.from({ length: 20 }, (_, j) => ({
          value: `folder 1 sub-folder ${i} child ${j}`,
          children: (
            <TreeItemLayout>{`folder 1 sub-folder ${i} child ${j}`}</TreeItemLayout>
          ),
          itemType: 'leaf' as const,
        })),
      })),
    ],
  },
  {
    value: 'folder 2',
    children: <TreeItemLayout>{`folder 2`}</TreeItemLayout>,
    itemType: 'branch',
    subtree: Array.from({ length: 20 }, (_, i) => ({
      value: `folder 2 child ${i}`,
      children: <TreeItemLayout>{`folder 2 child ${i}`}</TreeItemLayout>,
      itemType: 'leaf',
    })),
  },
];

const defaultItems = flattenTree_unstable(defaultItemsNested);
const defaultOpenItems = defaultItemsNested.map((item) => item.value);

const estimateSize = () => 32;

export const Virtualized = () => {
  const [allItems, setAllItems] =
    React.useState<HeadlessFlatTreeItemProps[]>(defaultItems);

  const [treeHelper] = React.useState(new TreeClass(defaultItems));

  const handleDragEnd = React.useCallback(
    (state: DragEndState<Record<string, never>, HeadlessFlatTreeItemProps>) => {
      console.log(
        'onDragEnd state',
        state,
        `drop to ${state.parentValue.new} at ${state.position.new}`
      );

      if (state.parentValue.new && !Number.isNaN(state.position.new)) {
        treeHelper.moveNode(
          state.active.id,
          state.parentValue.new === '__fuiHeadlessTreeRoot'
            ? undefined
            : state.parentValue.new,
          state.position.new
        );
        setAllItems(treeHelper.getFlatTreeForRender());
      }
    },
    [treeHelper]
  );

  const headlessTree = useHeadlessDndFlatTree(
    allItems,
    { defaultOpenItems },
    { onDragEnd: handleDragEnd }
  );
  const { onDragStart, onDragOver, onDragEnd, onDragCancel, draggingId } =
    headlessTree.getDndProps();

  const dndItems = Array.from(headlessTree.items()).map((item) => ({
    id: item.value,
  }));

  const dndContextProps = useDndContextProps();

  // -------- virtualized
  const parentRef = React.useRef<HTMLDivElement>(null);
  const headlessVirtualTree = useHeadlessFlatVirtualizedTree_unstable(
    headlessTree,
    {
      estimateSize,
      getScrollElement: () => parentRef.current,
    }
  );
  const virtualItems = headlessVirtualTree.getVirtualItems();
  // -------- virtualized

  return (
    <>
      <div style={{ padding: 10 }}>NOT virtualized:</div>
      <DndContext
        {...dndContextProps}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragStart={onDragStart}
        // TODO accessibility={accessibility}
      >
        <SortableContext items={dndItems} strategy={rectSortingStrategy}>
          <div style={{ height: '80vh', overflow: 'auto' }} ref={parentRef}>
            {/* An empty Tree that has no children on 1st render won't have keyboard navigation initialized. */}
            {virtualItems.length && (
              <FlatTree
                {...headlessTree.getTreeProps()}
                aria-label="Flat Tree"
                style={{
                  height: `${headlessVirtualTree.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualItems.map((flatTreeItem) => {
                  const { getTreeItemProps, virtualItemProps } = flatTreeItem;
                  const treeItemProps = getTreeItemProps();
                  return (
                    <DndFlatTreeItem
                      key={treeItemProps.value}
                      virtualItemProps={virtualItemProps}
                      {...treeItemProps}
                    />
                  );
                })}
              </FlatTree>
            )}
          </div>
          {draggingId &&
          virtualItems.find((item) => item.value === draggingId) ? null : (
            <HelperItem activeItemId={draggingId as string} />
          )}
        </SortableContext>

        {/* why need drag overlay instead of just using the dragged item - dragging an item triggers the hover style on the tree item. Overlay is cloned at the drag start and therefore it does not have hover style. */}
        <DndFlatTreeDragOverlay draggingItemValue={draggingId as string} />
      </DndContext>
    </>
  );
};

const useDndFlatTreeItemStyles = makeStyles({
  isDisabled: {
    opacity: 0.5,
  },
  isHidden: {
    opacity: 0,
  },
  virtualized: {
    left: 0,
    width: '100%',
    position: 'absolute',
  },
});
const DndFlatTreeItem = React.forwardRef<
  HTMLDivElement,
  FlatTreeItemProps & { virtualItemProps: Pick<VirtualItem, 'size' | 'start'> }
>(({ virtualItemProps, ...props }, ref) => {
  const {
    sortableResult: {
      active,
      isDragging,
      over,
      setNodeRef,
      transform,
      transition,
    },
    ...propsWithDndAttributes
  } = useSortableTreeItemProps(props);

  const styles = useDndFlatTreeItemStyles();
  const className = mergeClasses(
    isDragging && styles.isHidden,
    propsWithDndAttributes.className,
    styles.virtualized
  );

  const style = {
    ...propsWithDndAttributes.style,

    transform: CSS.Transform.toString(transform),
    transition,
    top: `${virtualItemProps.start}px`,
    height: `${virtualItemProps.size}px`,
  };

  const mergedRef = useMergedRefs<HTMLDivElement>(setNodeRef, ref);

  return (
    <FlatTreeItem
      {...propsWithDndAttributes}
      className={className}
      style={style}
      ref={mergedRef}
    />
  );
});

// -------- virtualized
// NOTES:
// 1. Helper item that is children of SortableContext, and calls useSortable to make sure the data for dragging item existing event if the item unmounted
// 2. If collapse on drag start, scroll to the dragging item in an use effect to make sure the item is always mounted
// TODO on keyboard drag, overlay item is overlaying the item after

const HelperItem = ({ activeItemId }: { activeItemId: TreeItemValue }) => {
  // always render the item that is being dragged. make sure dnd kit can access the dnd data of this item. Otherwise, when the dragging item unmount, `active` data in dnd will be lost. And we're using active data sortable index in useHeadlessDndFlatTree.
  useTypeSafeSortable({
    id: activeItemId,
  });

  return <></>;
};

function useHeadlessFlatVirtualizedTree_unstable<
  Props extends HeadlessFlatTreeItemProps
>(
  headlessTree: HeadlessDndFlatTree<Props>,
  virtualizerOptions: Omit<Parameters<typeof useVirtualizer>[0], 'count'>
): HeadlessDndFlatTree<Props> &
  Omit<ReturnType<typeof useVirtualizer>, 'getVirtualItems'> & {
    getVirtualItems: () => (HeadlessFlatTreeItem<Props> & {
      virtualItemProps: Pick<VirtualItem, 'size' | 'start'>;
    })[];
  } {
  const items = React.useMemo(
    () => Array.from(headlessTree.items()),
    [headlessTree]
  );

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    ...virtualizerOptions,
  });

  const baseGetVirtualItems = rowVirtualizer.getVirtualItems;
  const getVirtualItems = React.useCallback(
    () =>
      baseGetVirtualItems().map((virtualItem) => ({
        virtualItemProps: { size: virtualItem.size, start: virtualItem.start },
        ...items[virtualItem.index],
      })),
    [baseGetVirtualItems, items]
  );

  /**
   * Since navigation is not possible due to the fact that not all items are rendered,
   * we need to scroll to the next item and then invoke navigation.
   */
  const handleNavigation = useEventCallback(
    (
      event: TreeNavigationEvent_unstable,
      data: TreeNavigationData_unstable
    ) => {
      const nextItem = headlessTree.getNextNavigableItem(items, data);
      if (!nextItem) {
        return;
      }
      // if the next item is not rendered, scroll to it and try to navigate again
      if (!headlessTree.getElementFromItem(nextItem)) {
        event.preventDefault(); // preventing default disables internal navigation.
        rowVirtualizer.scrollToIndex(nextItem.index);
        // waiting for the next animation frame to allow the list to be scrolled
        requestAnimationFrame(() => headlessTree.navigate(data));
      }
    }
  );

  const baseGetTreeProps = headlessTree.getTreeProps;
  const getTreeProps = React.useCallback(
    () => ({
      ...baseGetTreeProps(),
      onNavigation: handleNavigation,
    }),
    [baseGetTreeProps, handleNavigation]
  );

  // When teams are expanded, on drag start it collapses and the dragged item may not be visible. Scroll to mount it.
  const dndProps = headlessTree.getDndProps();
  const draggingIndex = items.findIndex(
    (item) => item.value === dndProps.draggingId
  );
  React.useEffect(() => {
    if (draggingIndex >= 0) {
      rowVirtualizer.scrollToIndex(draggingIndex);
      console.log('useEffect rowVirtualizer.scrollToIndex', draggingIndex);
    }
  }, [draggingIndex, rowVirtualizer]);

  return {
    ...headlessTree,
    getTreeProps,
    ...rowVirtualizer,
    getVirtualItems,
  };
}
