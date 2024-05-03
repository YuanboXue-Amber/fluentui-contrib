import * as React from 'react';
import {
  TreeItemLayout,
  useEventCallback,
  FlatTree,
  TreeItemValue,
  FlatTreeProps,
  flattenTree_unstable,
  HeadlessFlatTreeItemProps,
  useMergedRefs,
  FlatTreeItem,
  ForwardRefComponent,
  FlatTreeItemProps,
} from '@fluentui/react-components';
import {
  closestCorners,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  Modifier,
  DndContext,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';

import { TreeClass } from '../../src/components/DndFlatTree/treeHelper';
import { useHeadlessDndFlatTree } from '../../src/components/DndFlatTree/useHeadlessDndFlatTree';
import { DragEndState } from '../../src/components/DndFlatTree/types';
import {
  DndFlatTreeItem,
  useSortableFlatTreeItem,
} from '../../src/components/DndFlatTreeItem/useSortableTreeItemProps';
import { DndFlatTreeDragOverlay } from '../../src/components/DndFlatTreeDragOverlay/DndFlatTreeDragOverlay';
import { useDndContextProps } from '../../src/dnd/useDndContextProps';

type DndData = {
  isCustomOrdered?: boolean;
  isDropDisabled?: (id: UniqueIdentifier) => boolean;
};

type NestedItemProps = HeadlessFlatTreeItemProps & {
  subtree?: NestedItemProps[];
  data?: DndData;
};

const defaultItemsNested: NestedItemProps[] = [
  {
    value: 'chats',
    children: <TreeItemLayout>{`chats`}</TreeItemLayout>,
    itemType: 'branch',
    subtree: Array.from({ length: 7 }, (_, i) => ({
      value: `chat ${i}`,
      children: <TreeItemLayout>{`chat ${i}`}</TreeItemLayout>,
      itemType: 'leaf',
    })),
    data: {
      isCustomOrdered: false,
      isDropDisabled: (id) => !id.toString().includes('chat '),
    },
  },
  {
    value: 'contacts',
    children: <TreeItemLayout>{`contacts`}</TreeItemLayout>,
    itemType: 'branch',
    subtree: [
      ...Array.from({ length: 6 }, (_, i) => ({
        value: `contact group ${i}`,
        children: <TreeItemLayout>{`contact group ${i}`}</TreeItemLayout>,
        itemType: 'branch' as const,
        subtree: Array.from({ length: 2 }, (_, j) => ({
          value: `contact group ${i} contact ${j}`,
          children: (
            <TreeItemLayout>{`contact group ${i} contact ${j}`}</TreeItemLayout>
          ),
          itemType: 'leaf' as const,
        })),
        data: {
          isCustomOrdered: false,
          isDropDisabled: (id) =>
            !id.toString().startsWith(`contact group ${i} contact`),
        },
      })),
    ],
    data: {
      isCustomOrdered: true,
      isDropDisabled: (id) => !id.toString().startsWith('contact group '),
    },
  },
  {
    value: 'favorites',
    children: <TreeItemLayout>{`favorites`}</TreeItemLayout>,
    itemType: 'branch',
    subtree: [
      ...Array.from({ length: 3 }, (_, i) => ({
        value: `favorite chat ${i}`,
        children: <TreeItemLayout>{`favorite chat ${i}`}</TreeItemLayout>,
        itemType: 'leaf' as const,
      })),
    ],
    data: {
      isCustomOrdered: true,
    },
  },
];

const defaultItems = flattenTree_unstable(defaultItemsNested);
const defaultOpenItems = defaultItemsNested.map((item) => item.value);

const CustomizedDndFlatTreeItem: ForwardRefComponent<
  FlatTreeItemProps & {
    data?: DndData;
  }
> = React.forwardRef((props, ref) => {
  const [propsWithDnd, setNodeRef, active] =
    useSortableFlatTreeItem<DndData>(props);

  if (active) {
    const isDropDisabled = props.data?.isDropDisabled?.(active.id);
    if (isDropDisabled) {
      propsWithDnd.style = {
        ...propsWithDnd.style,
        transform: 'unset',
        opacity: 0.5,
      };
    }
  }

  const mergedRef = useMergedRefs<HTMLDivElement>(setNodeRef, ref);

  return <FlatTreeItem {...propsWithDnd} ref={mergedRef} />;
});

export const Customized = () => {
  const [allItems, setAllItems] =
    React.useState<HeadlessFlatTreeItemProps[]>(defaultItems);

  const [treeHelper] = React.useState(new TreeClass(defaultItems));

  const handleDragEnd = React.useCallback(
    ({
      headlessTree,
      ...state
    }: DragEndState<DndData, HeadlessFlatTreeItemProps>) => {
      console.log('onDragEnd state', state);

      if (
        state.parentValue.old &&
        state.parentValue.new &&
        !Number.isNaN(state.position.new)
      ) {
        treeHelper.moveNode(
          state.active.id,
          state.parentValue.new,
          state.position.new
        );
        setAllItems(treeHelper.getFlatTreeForRender());
      }
    },
    [treeHelper]
  );

  const headlessTree = useHeadlessDndFlatTree(
    allItems,
    {
      defaultOpenItems,
    },
    {
      onDragEnd: handleDragEnd,
    }
  );
  const { onDragStart, onDragOver, onDragEnd, onDragCancel, draggingId } =
    headlessTree.getDndProps();

  const dndItems = Array.from(headlessTree.items()).map((item) => ({
    id: item.value,
  }));

  // ---------------------

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
        <SortableContext
          items={dndItems}
          strategy={
            rectSortingStrategy // Tree has display: flex, it doesn't work with verticalListSortingStrategy - causing detach between mouse and the dragged item
          }
        >
          <div style={{ height: '80vh', overflow: 'auto' }}>
            <FlatTree {...headlessTree.getTreeProps()} aria-label="Flat Tree">
              {Array.from(headlessTree.items(), (flatTreeItem) => {
                const { getTreeItemProps } = flatTreeItem;
                const treeItemProps = getTreeItemProps();
                return (
                  <CustomizedDndFlatTreeItem
                    key={treeItemProps.value}
                    {...treeItemProps}
                  />
                );
              })}
            </FlatTree>
          </div>
        </SortableContext>

        <DndFlatTreeDragOverlay draggingItemValue={draggingId as string} />
      </DndContext>
    </>
  );
};
