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
} from '@fluentui/react-components';
import { DndContext } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { TreeClass } from '../../src/components/DndFlatTree/treeHelper';
import { useHeadlessDndFlatTree } from '../../src/components/DndFlatTree/useHeadlessDndFlatTree';
import { DragEndState } from '../../src/components/DndFlatTree/types';
import { useDndContextProps } from '../../src/dnd/useDndContextProps';
import { DndFlatTreeDragOverlay } from '../../src/components/DndFlatTreeDragOverlay/DndFlatTreeDragOverlay';
import { useSortableTreeItemProps } from '../../src/components/DndFlatTreeItem/useSortableTreeItemProps';

type NestedItemProps = HeadlessFlatTreeItemProps & {
  subtree?: NestedItemProps[];
};

const defaultItemsNested: NestedItemProps[] = [
  {
    value: 'folder 0',
    children: <TreeItemLayout>{`folder 0`}</TreeItemLayout>,
    itemType: 'branch',
    subtree: Array.from({ length: 7 }, (_, i) => ({
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
      ...Array.from({ length: 6 }, (_, i) => ({
        value: `folder 1 sub-folder ${i}`,
        children: <TreeItemLayout>{`folder 1 sub-folder ${i}`}</TreeItemLayout>,
        itemType: 'branch' as const,
        subtree: Array.from({ length: 2 }, (_, j) => ({
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
    subtree: Array.from({ length: 3 }, (_, i) => ({
      value: `folder 2 child ${i}`,
      children: <TreeItemLayout>{`folder 2 child ${i}`}</TreeItemLayout>,
      itemType: 'leaf',
    })),
  },
];

const defaultItems = flattenTree_unstable(defaultItemsNested);
const defaultOpenItems = defaultItemsNested.map((item) => item.value);

export const Customized = () => {
  const [allItems, setAllItems] =
    React.useState<HeadlessFlatTreeItemProps[]>(defaultItems);

  const [treeHelper] = React.useState(new TreeClass(defaultItems));

  const handleDragEnd = React.useCallback(
    (state: DragEndState<Record<string, never>, HeadlessFlatTreeItemProps>) => {
      console.log('onDragEnd state', state);

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
          <div style={{ height: '80vh', overflow: 'auto' }}>
            <FlatTree {...headlessTree.getTreeProps()} aria-label="Flat Tree">
              {Array.from(headlessTree.items(), (flatTreeItem) => {
                const { getTreeItemProps } = flatTreeItem;
                const treeItemProps = getTreeItemProps();
                return (
                  <DndFlatTreeItem
                    key={treeItemProps.value}
                    {...treeItemProps}
                  />
                );
              })}
            </FlatTree>
          </div>
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
});
const DndFlatTreeItem = React.forwardRef<HTMLDivElement, FlatTreeItemProps>(
  (props, ref) => {
    const {
      sortableResult: {
        // active,
        isDragging,
        // over,
        setNodeRef,
        transform,
        transition,
      },
      ...propsWithDndAttributes
    } = useSortableTreeItemProps(props);

    const styles = useDndFlatTreeItemStyles();
    const className = mergeClasses(
      isDragging && styles.isHidden,
      propsWithDndAttributes.className
    );

    const style = {
      ...{
        transform: CSS.Transform.toString(transform),
        transition,
      },
      ...propsWithDndAttributes.style,
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
  }
);
