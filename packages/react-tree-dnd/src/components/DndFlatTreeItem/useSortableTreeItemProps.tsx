import * as React from 'react';
import {
  FlatTreeItemProps,
  makeStyles,
  mergeCallbacks,
} from '@fluentui/react-components';
import { useTypeSafeSortable } from '../DndFlatTree/DndTypeSafeTypes';

const useDndFlatTreeItemStyles = makeStyles({
  isDisabled: {
    opacity: 0.5,
  },
  isHidden: {
    opacity: 0,
  },
});

export function useSortableTreeItemProps<TData>(
  props: FlatTreeItemProps & {
    data?: TData;
  }
) {
  const { listeners, attributes, ...sortableResult } =
    useTypeSafeSortable<TData>({
      id: props.value,
      data: props.data,
    });

  return {
    ...props,
    ...attributes,
    onKeyDown: listeners?.onKeyDown
      ? mergeCallbacks(
          props.onKeyDown,
          listeners.onKeyDown as React.KeyboardEventHandler
        )
      : props.onKeyDown,
    onMouseDown: listeners?.onMouseDown
      ? mergeCallbacks(
          props.onMouseDown,
          listeners.onMouseDown as React.MouseEventHandler
        )
      : props.onMouseDown,
    onTouchStart: listeners?.onTouchStart
      ? mergeCallbacks(
          props.onTouchStart,
          listeners.onTouchStart as React.TouchEventHandler
        )
      : props.onTouchStart,
    sortableResult,
  };
}
