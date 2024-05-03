import * as React from 'react';
import { TreeItemValue, useFluent } from '@fluentui/react-components';
import { useTimeout, isHTMLElement } from '@fluentui/react-utilities';
import { DragOverlay } from '@dnd-kit/core';

// TODO make this slot

export const DRAG_OVERLAY_ELEMENT_ID = 'dnd-overlay-item';

export const DndFlatTreeDragOverlay = ({
  draggingItemValue,
}: {
  draggingItemValue?: TreeItemValue;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const { targetDocument } = useFluent();

  const [setTimeout, cancelTimeout] = useTimeout();

  React.useEffect(() => {
    if (!draggingItemValue || !targetDocument) {
      return;
    }

    setTimeout(() => {
      const activeNode = targetDocument.querySelector(
        `[data-fui-tree-item-value="${draggingItemValue}"]`
      );
      if (!activeNode || !isHTMLElement(activeNode)) {
        return;
      }

      const clonedNode = activeNode.cloneNode(true);
      if (clonedNode && isHTMLElement(clonedNode)) {
        clonedNode.style.opacity = '1';
        clonedNode.style.transform = 'none';
        clonedNode.style.transition = 'none';
        clonedNode.style.top = '0px'; // needed by virtualize

        if (ref.current && ref.current.firstChild) {
          ref.current.removeChild(ref.current.firstChild);
        }
        ref.current?.appendChild(clonedNode);
      }
    }, 0);

    return cancelTimeout;
  }, [cancelTimeout, draggingItemValue, setTimeout, targetDocument]);

  return (
    <DragOverlay>
      {draggingItemValue && (
        <div
          id={DRAG_OVERLAY_ELEMENT_ID}
          ref={ref}
          role="presentation"
          tabIndex={0}
        />
      )}
    </DragOverlay>
  );
};
