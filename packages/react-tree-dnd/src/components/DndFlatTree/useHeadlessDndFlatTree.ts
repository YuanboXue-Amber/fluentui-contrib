import * as React from 'react';
import {
  HeadlessFlatTree,
  HeadlessFlatTreeItemProps,
  HeadlessFlatTreeOptions,
  TreeItemValue,
  TreeOpenChangeData,
  TreeOpenChangeEvent,
  useEventCallback,
  useFluent,
  useHeadlessFlatTree_unstable,
} from '@fluentui/react-components';
import { useControllableState, useTimeout } from '@fluentui/react-utilities';
import { DndEventHandlers, DragUpdateData } from './types';
import { DndContextProps } from '@dnd-kit/core';
import {
  TypeSafeDragStartEvent,
  TypeSafeDragEndEvent,
  TypeSafeDragCancelEvent,
  TypesafeActive,
  TypeSafeDragOverEvent,
} from './DndTypeSafeTypes';

// TODO TData = {} default
export type OnDndFlatTreeOpenChange<TData> = (
  event: TreeOpenChangeEvent | Event | TypeSafeDragStartEvent<TData>,
  data:
    | TreeOpenChangeData
    | {
        type: 'DragStart' | 'DragEnd' | 'DragCancel';
        openItems: Set<TreeItemValue>;
      }
) => void;

type HeadlessDndFlatTreeItemProps<TData> = HeadlessFlatTreeItemProps & {
  data?: TData;
};

export function useHeadlessDndFlatTree<
  TData,
  TProps extends HeadlessDndFlatTreeItemProps<TData>
>(
  items: TProps[],
  options: Omit<HeadlessFlatTreeOptions, 'onOpenChange'> & {
    onOpenChange?: OnDndFlatTreeOpenChange<TData>;
  } = {},
  dndEventHandlers: DndEventHandlers<TData, TProps> = {}
): HeadlessFlatTree<TProps> & {
  getDndProps: () => Pick<
    DndContextProps,
    'onDragStart' | 'onDragOver' | 'onDragEnd' | 'onDragCancel'
  > & {
    draggingId?: TreeItemValue;
  };
} {
  // TODO open close broken
  const [openItems, setOpenItems] = useControllableState<Set<TreeItemValue>>({
    state: options.openItems ? new Set(options.openItems) : undefined,
    defaultState: options.defaultOpenItems
      ? new Set(options.defaultOpenItems)
      : undefined,
    initialState: new Set(),
  });

  const handleOpenChange: OnDndFlatTreeOpenChange<TData> = useEventCallback(
    (event, data) => {
      if (options.onOpenChange) {
        options.onOpenChange?.(event, data);
      }
      setOpenItems(data.openItems);
    }
  );

  const currOpenItems = React.useRef<Set<TreeItemValue> | null>(null);
  const collapseSubTree = React.useCallback(
    (dndEvent: TypeSafeDragStartEvent<TData>, value?: TreeItemValue) => {
      setOpenItems((prevOpenItems) => {
        currOpenItems.current = new Set(prevOpenItems);
        const nextOpenItems = new Set(prevOpenItems);

        const parentValue = items.find(
          (item) => item.value === value
        )?.parentValue;

        items
          .filter((item) => item.parentValue === parentValue)
          .forEach(({ value }) => {
            nextOpenItems.delete(value);
          });

        handleOpenChange?.(dndEvent, {
          openItems: nextOpenItems,
          type: 'DragStart',
        });
        return nextOpenItems;
      });
    },
    [handleOpenChange, items, setOpenItems]
  );
  const restoreOpenItems = React.useCallback(
    (
      dndEvent: TypeSafeDragEndEvent<TData> | TypeSafeDragCancelEvent<TData>,
      type: 'DragEnd' | 'DragCancel'
    ) => {
      if (currOpenItems.current) {
        setOpenItems(currOpenItems.current);
        handleOpenChange?.(dndEvent.activatorEvent, {
          type,
          openItems: currOpenItems.current,
        });
      }
      currOpenItems.current = null;
    },
    [handleOpenChange, setOpenItems]
  );

  const headlessTree = useHeadlessFlatTree_unstable(items, {
    ...options,
    openItems,
    onOpenChange: handleOpenChange,
  });

  const [activeItem, setActiveItem] =
    React.useState<TypesafeActive<TData> | null>(null);

  const { onDragStart, onDragOver, onDragEnd, onDragCancel } = dndEventHandlers;

  const handleDragStart = React.useCallback(
    (dndEvent: TypeSafeDragStartEvent<TData>) => {
      onDragStart?.({ ...dndEvent, headlessTree });

      collapseSubTree(dndEvent, dndEvent.active.id);
      setActiveItem(dndEvent.active);
    },
    [collapseSubTree, headlessTree, onDragStart]
  );

  const handleDragCancel = React.useCallback(
    (dndEvent: TypeSafeDragCancelEvent<TData>) => {
      if (onDragCancel) {
        onDragCancel({
          ...dndEvent,
          headlessTree,
          ...getDragState(dndEvent, headlessTree),
        });
      }

      setActiveItem(null);
      restoreOpenItems(dndEvent, 'DragCancel');

      // TODO restore focus?
    },
    [headlessTree, onDragCancel, restoreOpenItems]
  );

  const handleDragEnd = React.useCallback(
    (dndEvent: TypeSafeDragEndEvent<TData>) => {
      if (onDragEnd) {
        onDragEnd({
          ...dndEvent,
          headlessTree,
          ...getDragState(dndEvent, headlessTree),
        });
      }

      restoreOpenItems(dndEvent, 'DragEnd');
      setActiveItem(null);

      // TODO focus on drop?
    },
    [headlessTree, onDragEnd, restoreOpenItems]
  );

  const handleDragOver = React.useCallback(
    (dndEvent: TypeSafeDragOverEvent<TData>) => {
      // TODO focus on overlay item

      if (onDragOver) {
        onDragOver({
          ...dndEvent,
          headlessTree,
          ...getDragState(dndEvent, headlessTree),
        });
      }
    },
    [headlessTree, onDragOver]
  );

  const getDndProps = React.useCallback(
    () => ({
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
      draggingId: activeItem?.id,
    }),
    [
      activeItem?.id,
      handleDragCancel,
      handleDragEnd,
      handleDragOver,
      handleDragStart,
    ]
  );

  return React.useMemo(
    () => ({
      ...headlessTree,
      getDndProps,
    }),
    [getDndProps, headlessTree]
  );
}

const defaultDragState = {
  parentValue: {
    old: undefined,
    new: undefined,
  },
  position: {
    old: NaN,
    new: NaN,
  },
  index: {
    old: NaN,
    new: NaN,
  },
};
const getDragState = <TData, TProps extends HeadlessFlatTreeItemProps>(
  {
    active,
    over,
  }:
    | TypeSafeDragCancelEvent<TData>
    | TypeSafeDragEndEvent<TData>
    | TypeSafeDragOverEvent<TData>,

  headlessTree: HeadlessFlatTree<TProps>
): DragUpdateData => {
  const activeData = active.data.current;
  const overData = over?.data?.current;
  if (!activeData || !overData) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('No dnd data for active or over item', active, over);
    }
    return defaultDragState;
  }

  const visibleItems = Array.from(headlessTree.items());

  const item = visibleItems.find(({ value }) => value === active.id);
  if (!item) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('No item found for active item value', active.id);
    }
    return defaultDragState;
  }
  const overItem = visibleItems.find(({ value }) => value === over.id);
  if (!overItem) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('No item found for over item value', over.id);
    }
    return defaultDragState;
  }

  const parentItemIndex = visibleItems.findIndex(
    ({ value }) => value === item.parentValue
  );
  const overItemParentIndex = visibleItems.findIndex(
    ({ value }) => value === overItem.parentValue
  );

  return {
    parentValue: {
      old: item.parentValue,
      new: overItem.parentValue,
    },
    position: {
      old: activeData.sortable.index - parentItemIndex - 1,
      new: overData.sortable.index - overItemParentIndex - 1,
    },
    index: {
      old: activeData.sortable.index,
      new: overData.sortable.index,
    },
  };
};
