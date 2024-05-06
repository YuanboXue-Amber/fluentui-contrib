/**
 * dnd-kit `data` field lack type safety: https://github.com/clauderic/dnd-kit/issues/935
 * This file provides type-safe implementations for dnd-kit types.
 */
import {
  Active,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  Over,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';

type SortableData = Pick<ReturnType<typeof useSortable>['data'], 'sortable'>;

export type TypesafeActive<TData = Record<string, never>> = Omit<
  Active,
  'data'
> & {
  data: React.MutableRefObject<(TData & SortableData) | undefined>;
};
export type TypesafeOver<TData = Record<string, never>> = Omit<Over, 'data'> & {
  data: React.MutableRefObject<(TData & SortableData) | undefined>;
};

export const useTypeSafeSortable: <TData = Record<string, never>>(
  args: Omit<Parameters<typeof useSortable>[0], 'data'> & {
    data?: TData;
  }
) => Omit<ReturnType<typeof useSortable>, 'active' | 'over'> & {
  active: TypesafeActive<TData> | null;
  over: TypesafeOver<TData> | null;
} = useSortable as any;

export type TypeSafeDragStartEvent<TData = Record<string, never>> = Omit<
  DragStartEvent,
  'active'
> & {
  active: TypesafeActive<TData>;
};
export type TypeSafeDragOverEvent<TData = Record<string, never>> = Omit<
  DragOverEvent,
  'active' | 'over'
> & {
  active: TypesafeActive<TData>;
  over: TypesafeOver<TData> | null;
};
export type TypeSafeDragCancelEvent<TData = Record<string, never>> = Omit<
  DragCancelEvent,
  'active' | 'over'
> & {
  active: TypesafeActive<TData>;
  over: TypesafeOver<TData> | null;
};
export type TypeSafeDragEndEvent<TData = Record<string, never>> = Omit<
  DragEndEvent,
  'active' | 'over'
> & {
  active: TypesafeActive<TData>;
  over: TypesafeOver<TData> | null;
};
