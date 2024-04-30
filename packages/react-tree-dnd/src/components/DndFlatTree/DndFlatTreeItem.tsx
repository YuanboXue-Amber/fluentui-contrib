import * as React from 'react';
import {
  FlatTreeItem,
  FlatTreeItemProps,
  ForwardRefComponent,
  makeStyles,
  mergeClasses,
  useMergedRefs,
} from '@fluentui/react-components';
import { CSS } from '@dnd-kit/utilities';
import { TypesafeActive, useTypeSafeSortable } from './DndTypeSafeTypes';
import { Data } from '@dnd-kit/core';

const useDndFlatTreeItemStyles = makeStyles({
  isDisabled: {
    opacity: 0.5,
  },
  isHidden: {
    opacity: 0,
  },
});

export function useSortableFlatTreeItem<TData>(
  options: FlatTreeItemProps & {
    data?: TData;
  }
): [
  FlatTreeItemProps,
  (node: HTMLElement | null) => void,

  active: TypesafeActive<TData> | null
] {
  const {
    active,
    attributes,
    isDragging,
    listeners,
    // over,
    setNodeRef,
    transform,
    transition,
  } = useTypeSafeSortable<TData>({
    id: options.value,
    data: options.data,
  });

  const styles = useDndFlatTreeItemStyles();
  const className = mergeClasses(
    isDragging && styles.isHidden,
    options.className
  );

  const style = {
    ...{
      transform: CSS.Transform.toString(transform),
      transition,
    },
    ...options.style,
  };

  return [
    {
      ...options,
      style,
      className,
      ...attributes,
      ...listeners, // TODO merge listeners
    },
    setNodeRef,
    active,
  ];
}

export const DndFlatTreeItem: ForwardRefComponent<
  FlatTreeItemProps & {
    data?: Data;
  }
> = React.forwardRef((props, ref) => {
  const [propsWithDnd, setNodeRef] = useSortableFlatTreeItem(props);

  const mergedRef = useMergedRefs<HTMLDivElement>(setNodeRef, ref);

  return <FlatTreeItem {...propsWithDnd} ref={mergedRef} />;
});
