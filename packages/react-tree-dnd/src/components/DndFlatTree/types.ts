import {
  HeadlessFlatTree,
  HeadlessFlatTreeItemProps,
  TreeItemValue,
} from '@fluentui/react-components';
import {
  TypeSafeDragCancelEvent,
  TypeSafeDragEndEvent,
  TypeSafeDragOverEvent,
  TypeSafeDragStartEvent,
} from './DndTypeSafeTypes';

export type DragStartState<
  TData,
  TProps extends HeadlessFlatTreeItemProps
> = TypeSafeDragStartEvent<TData> & {
  headlessTree: HeadlessFlatTree<TProps>;
};

export type DragUpdateData = {
  parentValue: {
    old: TreeItemValue | undefined;
    new: TreeItemValue | undefined;
  };
  /**
   * Position of the item in the current subtree
   */
  position: {
    old: number;
    new: number;
  };
  /**
   * Index of the item among all visible items in the entire flat tree
   */
  index: {
    old: number;
    new: number;
  };
};

export type DragOverState<
  TData,
  TProps extends HeadlessFlatTreeItemProps
> = TypeSafeDragOverEvent<TData> &
  DragUpdateData & {
    headlessTree: HeadlessFlatTree<TProps>;
  };

export type DragEndState<
  TData,
  TProps extends HeadlessFlatTreeItemProps
> = TypeSafeDragEndEvent<TData> &
  DragUpdateData & {
    headlessTree: HeadlessFlatTree<TProps>;
  };

export type DragCancelState<
  TData,
  TProps extends HeadlessFlatTreeItemProps
> = TypeSafeDragCancelEvent<TData> &
  DragUpdateData & {
    headlessTree: HeadlessFlatTree<TProps>;
  };

export type DndEventHandlers<
  TData,
  TProps extends HeadlessFlatTreeItemProps
> = {
  onDragCancel?: (state: DragCancelState<TData, TProps>) => void;
  onDragEnd?: (state: DragEndState<TData, TProps>) => void;
  onDragOver?: (state: DragOverState<TData, TProps>) => void;
  onDragStart?: (state: DragStartState<TData, TProps>) => void;
};
