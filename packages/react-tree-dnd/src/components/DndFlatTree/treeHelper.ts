import type { TreeItemProps, TreeItemValue } from '@fluentui/react-components';

type TreeItemType = TreeItemProps['itemType'];

/**
 * Represents tree item props that are not related to its position or structure within the tree.
 */
export type ExtrinsicTreeItemProps = Omit<
  TreeItemProps,
  'itemType' | 'value' | 'parentValue'
>;

type TreeNodeWithSubtree<Props extends ExtrinsicTreeItemProps> = Props & {
  value: TreeItemValue;
  parentValue?: TreeItemValue;
  itemType?: TreeItemType;

  subtree: TreeNodeWithSubtree<Props>[];
};

type FlatTreeNodeForRender<Props extends ExtrinsicTreeItemProps> = Props & {
  value: TreeItemValue;
  parentValue?: TreeItemValue;
  itemType?: TreeItemType;

  position: number;
};

const ROOT_VALUE: TreeItemValue = '__fuiTreeHelperRoot';
class TreeRootNode<Props extends ExtrinsicTreeItemProps> {
  public itemType: TreeItemType = 'branch';

  public value: TreeItemValue = ROOT_VALUE;

  public subtree: TreeNode<Props>[] = [];
}

class TreeNode<Props extends ExtrinsicTreeItemProps> {
  /**
   * @internal
   */
  public _nodeProps: Props;

  public itemType: TreeItemType;

  public value: TreeItemValue;
  public parentValue: TreeItemValue;

  public subtree: TreeNode<Props>[];

  constructor(
    props: Props & {
      value: TreeItemValue;
      parentValue: TreeItemValue;
      itemType?: TreeItemType;
    }
  ) {
    this._nodeProps = props;
    const { value, parentValue, itemType } = props;
    this.value = value;
    this.parentValue = parentValue;
    this.subtree = [];
    this.itemType = itemType ?? 'leaf';
  }
}

export class TreeClass<Props extends ExtrinsicTreeItemProps> {
  private rootNode = new TreeRootNode<Props>();
  private nodes: Map<TreeItemValue, TreeNode<Props>>;

  constructor(
    nodes: (Props & {
      value: TreeItemValue;
      parentValue?: TreeItemValue;
      itemType?: TreeItemType;
      position?: number;
    })[] = []
  ) {
    this.nodes = new Map();
    this.nodes.set(this.rootNode.value, this.rootNode as TreeNode<Props>);

    nodes.forEach((node) => {
      this.addNode(node);
    });
  }

  public addNode(
    props: Props & {
      value: TreeItemValue;
      parentValue?: TreeItemValue;
      itemType?: TreeItemType;
      position?: number;
    }
  ): void {
    const { value, parentValue, position } = props;

    if (this.nodes.has(value)) {
      console.error(`[Tree addNode] Node with value ${value} already exists.`);
      return;
    }

    const newNode = new TreeNode({
      ...props,
      parentValue: parentValue ?? this.rootNode.value,
    });

    const parentNode = this.nodes.get(parentValue ?? this.rootNode.value);

    if (!parentNode) {
      console.error(
        `[Tree addNode] Parent node with value ${parentValue} not found.`
      );
      return;
    }
    if (parentNode.itemType === 'leaf') {
      console.error(
        `[Tree addNode] Parent node with value ${parentValue} is a leaf node. Cannot add children to leaf nodes.\n` +
          `Change the parent node to a branch node via \`updateNode\` method.`
      );
      return;
    }
    if (position !== undefined) {
      parentNode.subtree.splice(position, 0, newNode);
    } else {
      parentNode.subtree.push(newNode);
    }

    this.nodes.set(value, newNode);
  }

  public updateNode(
    value: TreeItemValue,
    nodeProps: Partial<Props>,
    itemType?: TreeItemType
  ): void {
    const nodeToUpdate = this.nodes.get(value);
    if (!nodeToUpdate) {
      console.error(`[Tree updateNode] Node with value ${value} not found.`);
      return;
    }

    nodeToUpdate._nodeProps = { ...nodeToUpdate._nodeProps, ...nodeProps };

    if (itemType) {
      nodeToUpdate.itemType = itemType;
    }
  }

  public removeNode(value: TreeItemValue): void {
    const nodeToRemove = this.nodes.get(value);
    if (!nodeToRemove) {
      console.error(
        `[Tree removeNode] Node with value ${value} not found. Nothing will be removed.`
      );
      return;
    }

    // Remove its subtree
    nodeToRemove.subtree.forEach((child) => this.removeNode(child.value));

    // Remove itself
    this.nodes.delete(value);

    // Remove from parent subtree

    const parentNode = this.nodes.get(nodeToRemove.parentValue);
    if (!parentNode) {
      return;
    }
    parentNode.subtree = parentNode.subtree.filter(
      (node) => node.value !== value
    );
  }

  public moveNode(
    value: TreeItemValue,
    parentValue?: TreeItemValue, // when not specified, move to the root level
    position?: number // when not specified, move to the end of the parent subtree
  ): void {
    const nodeToMove = this.nodes.get(value);
    if (!nodeToMove) {
      console.error(`[Tree moveNode] Node with value ${value} not found.`);
      return;
    }

    const moveToSubtree = (targetSubtree: TreeNode<Props>[]) => {
      if (position !== undefined) {
        targetSubtree.splice(position, 0, nodeToMove);
      } else {
        targetSubtree.push(nodeToMove);
      }
    };

    const sourceParentNode = this.nodes.get(nodeToMove.parentValue);
    if (!sourceParentNode) {
      console.error(
        `[Tree moveNode] Parent node with value ${nodeToMove.parentValue} for node with value ${value} not found.`
      );
      return;
    }
    sourceParentNode.subtree = sourceParentNode.subtree.filter(
      (child) => child.value !== value
    );

    const targetParentNode = !parentValue
      ? this.rootNode
      : parentValue === sourceParentNode.value
      ? sourceParentNode
      : this.nodes.get(parentValue);
    if (!targetParentNode) {
      console.error(
        `[Tree moveNode] Parent node with value ${parentValue} not found.`
      );
      return;
    }
    nodeToMove.parentValue = targetParentNode.value;
    moveToSubtree(targetParentNode.subtree);
  }

  public getTree(
    value?: TreeItemValue
  ): TreeNode<Props> | null | TreeNode<Props>[] {
    if (value) {
      const node = this.nodes.get(value);
      if (!node) {
        console.error(`[Tree getTree] Node with value ${value} not found.`);
        return null;
      }
      return node;
    }

    return this.rootNode.subtree;
  }

  public getTreeForRender(
    value?: TreeItemValue
  ): TreeNodeWithSubtree<Props> | null | TreeNodeWithSubtree<Props>[] {
    const tree = this.getTree(value);
    if (!tree) {
      return null;
    }
    // for each node in the tree, spread _nodeProps and add itemType
    if (Array.isArray(tree)) {
      return tree.map((root) => this.createTreeItemForRender(root));
    } else {
      return this.createTreeItemForRender(tree);
    }
  }

  public getFlatTreeForRender(
    value?: TreeItemValue
  ): FlatTreeNodeForRender<Props>[] {
    const tree = this.getTreeForRender(value);
    if (!tree) {
      return [];
    }

    if (Array.isArray(tree)) {
      return tree.flatMap((root, index) => this.flattenTree(root, index));
    } else {
      let position;
      if (value) {
        const node = this.nodes.get(value);
        const parentNode =
          node?.parentValue !== undefined
            ? this.nodes.get(node?.parentValue)
            : undefined;
        if (parentNode) {
          position = parentNode.subtree.findIndex(
            (child) => child.value === value
          );
        }
      }
      return this.flattenTree(tree, position ?? 0);
    }
  }

  private createTreeItemForRender(
    node: TreeNode<Props>
  ): TreeNodeWithSubtree<Props> {
    return {
      ...node._nodeProps,
      value: node.value,
      parentValue:
        node.parentValue === this.rootNode.value ? undefined : node.parentValue,
      itemType: node.itemType,
      subtree: node.subtree.map((child) => this.createTreeItemForRender(child)),
    };
  }

  private flattenTree(
    node: TreeNodeWithSubtree<Props>,
    position: number
  ): FlatTreeNodeForRender<Props>[] {
    const flattenedNode: FlatTreeNodeForRender<Props> & {
      subtree: undefined;
    } = {
      ...node,
      position,
      subtree: undefined,
    };
    const flattenedSubtree = node.subtree.flatMap((child, index) =>
      this.flattenTree(child, index)
    );
    return [flattenedNode, ...flattenedSubtree];
  }
}
