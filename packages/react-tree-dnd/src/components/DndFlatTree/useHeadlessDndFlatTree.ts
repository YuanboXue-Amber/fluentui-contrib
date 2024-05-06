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
import { useControllableState } from '@fluentui/react-utilities';
import { DndEventHandlers, DragUpdateData } from './types';
import { DndContextProps } from '@dnd-kit/core';
import {
  TypeSafeDragStartEvent,
  TypeSafeDragEndEvent,
  TypeSafeDragCancelEvent,
  TypesafeActive,
  TypeSafeDragOverEvent,
} from '../../dnd';
import { DRAG_OVERLAY_ELEMENT_ID } from '../DndFlatTreeDragOverlay';

export type OnDndFlatTreeOpenChange<TData = Record<string, never>> = (
  event: TreeOpenChangeEvent | Event | TypeSafeDragStartEvent<TData>,
  data:
    | TreeOpenChangeData
    | {
        type: 'DragStart' | 'DragEnd' | 'DragCancel';
        openItems: Set<TreeItemValue>;
      }
) => void;

type HeadlessDndFlatTreeItemProps<TData = Record<string, never>> =
  HeadlessFlatTreeItemProps & {
    data?: TData;
  };

export type HeadlessDndFlatTree<TProps extends HeadlessDndFlatTreeItemProps> =
  HeadlessFlatTree<TProps> & {
    getDndProps: () => Pick<
      DndContextProps,
      'onDragStart' | 'onDragOver' | 'onDragEnd' | 'onDragCancel'
    > & {
      draggingId?: TreeItemValue;
    };
  };

export function useHeadlessDndFlatTree<
  TData = Record<string, never>,
  TProps extends HeadlessDndFlatTreeItemProps = HeadlessDndFlatTreeItemProps
>(
  items: TProps[],
  options: Omit<HeadlessFlatTreeOptions, 'onOpenChange'> & {
    onOpenChange?: OnDndFlatTreeOpenChange<TData>;
  } = {},
  dndEventHandlers: DndEventHandlers<TData, TProps> = {}
): HeadlessDndFlatTree<TProps> {
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

  const collapseSubTree = useEventCallback(
    (dndEvent: TypeSafeDragStartEvent<TData>, value: TreeItemValue) => {
      setOpenItems((prevOpenItems) => {
        currOpenItems.current = new Set(prevOpenItems);
        const nextOpenItems = new Set(prevOpenItems);
        nextOpenItems.delete(value);

        options.onOpenChange?.(dndEvent, {
          openItems: nextOpenItems,
          type: 'DragStart',
        });
        return nextOpenItems;
      });
    }
  );
  const restoreOpenItems = useEventCallback(
    (
      dndEvent: TypeSafeDragEndEvent<TData> | TypeSafeDragCancelEvent<TData>,
      type: 'DragEnd' | 'DragCancel'
    ) => {
      if (currOpenItems.current) {
        handleOpenChange?.(dndEvent.activatorEvent, {
          type,
          openItems: currOpenItems.current,
        });
      }
      currOpenItems.current = null;
    }
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

      // collapse the subtree of the active item. Otherwise the active item's children will stay in view when the active item is being dragged
      collapseSubTree(dndEvent, dndEvent.active.id);
      setActiveItem(dndEvent.active);
    },
    [collapseSubTree, headlessTree, onDragStart]
  );

  const handleDragCancel = React.useCallback(
    (dndEvent: TypeSafeDragCancelEvent<TData>) => {
      onDragCancel?.({
        ...dndEvent,
        headlessTree,
        ...getDragState(dndEvent, headlessTree, openItems),
      });

      setActiveItem(null);
      restoreOpenItems(dndEvent, 'DragCancel');
    },
    [headlessTree, onDragCancel, openItems, restoreOpenItems]
  );

  const handleDragEnd = React.useCallback(
    (dndEvent: TypeSafeDragEndEvent<TData>) => {
      onDragEnd?.({
        ...dndEvent,
        headlessTree,
        ...getDragState(dndEvent, headlessTree, openItems),
      });

      restoreOpenItems(dndEvent, 'DragEnd');
      setActiveItem(null);
    },
    [headlessTree, onDragEnd, openItems, restoreOpenItems]
  );

  const { targetDocument } = useFluent();
  const handleDragOver = React.useCallback(
    (dndEvent: TypeSafeDragOverEvent<TData>) => {
      // focus the drag overlay to prevent the focus from jumping to the next item
      targetDocument?.getElementById?.(DRAG_OVERLAY_ELEMENT_ID)?.focus();

      onDragOver?.({
        ...dndEvent,
        headlessTree,
        ...getDragState(dndEvent, headlessTree, openItems),
      });
    },
    [headlessTree, onDragOver, openItems, targetDocument]
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

  headlessTree: HeadlessFlatTree<TProps>,
  openItems: Set<TreeItemValue>
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

  let newParentValue = overItem.parentValue;
  let newPosition = overItem.position;

  // find the left sibling of the over item, if it is expanded, drop as last child.
  let leftSibling;
  for (let i = overItem.index - 1; i >= 0; i--) {
    if (visibleItems[i].parentValue === overItem.parentValue) {
      leftSibling = visibleItems[i];
      break;
    }
  }

  if (
    leftSibling &&
    leftSibling.itemType === 'branch' &&
    openItems.has(leftSibling.value)
  ) {
    newParentValue = leftSibling.value;
    newPosition = leftSibling.childrenValues.length + 1;
  }

  return {
    parentValue: {
      old: item.parentValue,
      new: newParentValue,
    },
    position: {
      old: item.position,
      new: newPosition,
    },
    index: {
      old: activeData.sortable.index,
      new: overData.sortable.index,
    },
  };
};
