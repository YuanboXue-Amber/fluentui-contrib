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
} from '../../dnd/DndTypeSafeTypes';

export type DragStartState<
  TData = Record<string, never>,
  TProps extends HeadlessFlatTreeItemProps = HeadlessFlatTreeItemProps
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
  TData = Record<string, never>,
  TProps extends HeadlessFlatTreeItemProps = HeadlessFlatTreeItemProps
> = TypeSafeDragOverEvent<TData> &
  DragUpdateData & {
    headlessTree: HeadlessFlatTree<TProps>;
  };

export type DragEndState<
  TData = Record<string, never>,
  TProps extends HeadlessFlatTreeItemProps = HeadlessFlatTreeItemProps
> = TypeSafeDragEndEvent<TData> &
  DragUpdateData & {
    headlessTree: HeadlessFlatTree<TProps>;
  };

export type DragCancelState<
  TData = Record<string, never>,
  TProps extends HeadlessFlatTreeItemProps = HeadlessFlatTreeItemProps
> = TypeSafeDragCancelEvent<TData> &
  DragUpdateData & {
    headlessTree: HeadlessFlatTree<TProps>;
  };

export type DndEventHandlers<
  TData = Record<string, never>,
  TProps extends HeadlessFlatTreeItemProps = HeadlessFlatTreeItemProps
> = {
  onDragCancel?: (state: DragCancelState<TData, TProps>) => void;
  onDragEnd?: (state: DragEndState<TData, TProps>) => void;
  onDragOver?: (state: DragOverState<TData, TProps>) => void;
  onDragStart?: (state: DragStartState<TData, TProps>) => void;
};
