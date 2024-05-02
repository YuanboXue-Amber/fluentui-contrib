import { TreeClass as Tree } from './treeHelper';

describe('Tree', () => {
  let tree: Tree<{ children: string }>;

  beforeEach(() => {
    tree = new Tree();
  });

  it('adds a node', () => {
    tree.addNode({ value: 'node1', children: 'node1' });
    expect(tree.getTree('node1')).toMatchInlineSnapshot(`
      TreeNode {
        "_nodeProps": {
          "children": "node1",
          "parentValue": "__fuiTreeHelperRoot",
          "value": "node1",
        },
        "itemType": "leaf",
        "parentValue": "__fuiTreeHelperRoot",
        "subtree": [],
        "value": "node1",
      }
    `);
  });

  it('updates a node', () => {
    tree.addNode({ value: 'node1', children: 'node1' });
    tree.updateNode('node1', { children: 'new-node1' });
    expect(tree.getTree('node1')).toMatchInlineSnapshot(`
      TreeNode {
        "_nodeProps": {
          "children": "new-node1",
          "parentValue": "__fuiTreeHelperRoot",
          "value": "node1",
        },
        "itemType": "leaf",
        "parentValue": "__fuiTreeHelperRoot",
        "subtree": [],
        "value": "node1",
      }
    `);
  });

  it('removes a node', () => {
    const mockConsoleError = jest.fn().mockImplementationOnce(() => {});
    console.error = mockConsoleError;

    tree.addNode({ value: 'node1', children: 'node1' });
    tree.removeNode('node1');
    expect(tree.getTree('node1')).toBeNull();

    expect(mockConsoleError).toHaveBeenCalledWith(
      '[Tree getTree] Node with value node1 not found.'
    );
  });

  it('moves a node', () => {
    tree.addNode({ value: 'node1', children: 'node1', itemType: 'branch' });
    tree.addNode({
      value: 'node1-1',
      parentValue: 'node1',
      children: 'node1-1',
    });
    tree.addNode({
      value: 'node1-2',
      parentValue: 'node1',
      children: 'node1-2',
      itemType: 'branch',
    });
    tree.addNode({
      value: 'node1-2-1',
      parentValue: 'node1-2',
      children: 'node1-2-1',
    });
    tree.addNode({ value: 'node2', children: 'node2', itemType: 'branch' });
    // move node1-2 within the same parent
    tree.moveNode('node1-2', 'node1', 0);
    expect(tree.getTree()).toMatchInlineSnapshot(`
      [
        TreeNode {
          "_nodeProps": {
            "children": "node1",
            "itemType": "branch",
            "parentValue": "__fuiTreeHelperRoot",
            "value": "node1",
          },
          "itemType": "branch",
          "parentValue": "__fuiTreeHelperRoot",
          "subtree": [
            TreeNode {
              "_nodeProps": {
                "children": "node1-2",
                "itemType": "branch",
                "parentValue": "node1",
                "value": "node1-2",
              },
              "itemType": "branch",
              "parentValue": "node1",
              "subtree": [
                TreeNode {
                  "_nodeProps": {
                    "children": "node1-2-1",
                    "parentValue": "node1-2",
                    "value": "node1-2-1",
                  },
                  "itemType": "leaf",
                  "parentValue": "node1-2",
                  "subtree": [],
                  "value": "node1-2-1",
                },
              ],
              "value": "node1-2",
            },
            TreeNode {
              "_nodeProps": {
                "children": "node1-1",
                "parentValue": "node1",
                "value": "node1-1",
              },
              "itemType": "leaf",
              "parentValue": "node1",
              "subtree": [],
              "value": "node1-1",
            },
          ],
          "value": "node1",
        },
        TreeNode {
          "_nodeProps": {
            "children": "node2",
            "itemType": "branch",
            "parentValue": "__fuiTreeHelperRoot",
            "value": "node2",
          },
          "itemType": "branch",
          "parentValue": "__fuiTreeHelperRoot",
          "subtree": [],
          "value": "node2",
        },
      ]
    `);

    // move node1-2 to node2
    tree.moveNode('node1-2', 'node2');
    expect(tree.getTree()).toMatchInlineSnapshot(`
      [
        TreeNode {
          "_nodeProps": {
            "children": "node1",
            "itemType": "branch",
            "parentValue": "__fuiTreeHelperRoot",
            "value": "node1",
          },
          "itemType": "branch",
          "parentValue": "__fuiTreeHelperRoot",
          "subtree": [
            TreeNode {
              "_nodeProps": {
                "children": "node1-1",
                "parentValue": "node1",
                "value": "node1-1",
              },
              "itemType": "leaf",
              "parentValue": "node1",
              "subtree": [],
              "value": "node1-1",
            },
          ],
          "value": "node1",
        },
        TreeNode {
          "_nodeProps": {
            "children": "node2",
            "itemType": "branch",
            "parentValue": "__fuiTreeHelperRoot",
            "value": "node2",
          },
          "itemType": "branch",
          "parentValue": "__fuiTreeHelperRoot",
          "subtree": [
            TreeNode {
              "_nodeProps": {
                "children": "node1-2",
                "itemType": "branch",
                "parentValue": "node1",
                "value": "node1-2",
              },
              "itemType": "branch",
              "parentValue": "node2",
              "subtree": [
                TreeNode {
                  "_nodeProps": {
                    "children": "node1-2-1",
                    "parentValue": "node1-2",
                    "value": "node1-2-1",
                  },
                  "itemType": "leaf",
                  "parentValue": "node1-2",
                  "subtree": [],
                  "value": "node1-2-1",
                },
              ],
              "value": "node1-2",
            },
          ],
          "value": "node2",
        },
      ]
    `);

    // move root node2 within the same parent
    tree.moveNode('node2', undefined, 0);
    expect(tree.getTree()).toMatchInlineSnapshot(`
      [
        TreeNode {
          "_nodeProps": {
            "children": "node2",
            "itemType": "branch",
            "parentValue": "__fuiTreeHelperRoot",
            "value": "node2",
          },
          "itemType": "branch",
          "parentValue": "__fuiTreeHelperRoot",
          "subtree": [
            TreeNode {
              "_nodeProps": {
                "children": "node1-2",
                "itemType": "branch",
                "parentValue": "node1",
                "value": "node1-2",
              },
              "itemType": "branch",
              "parentValue": "node2",
              "subtree": [
                TreeNode {
                  "_nodeProps": {
                    "children": "node1-2-1",
                    "parentValue": "node1-2",
                    "value": "node1-2-1",
                  },
                  "itemType": "leaf",
                  "parentValue": "node1-2",
                  "subtree": [],
                  "value": "node1-2-1",
                },
              ],
              "value": "node1-2",
            },
          ],
          "value": "node2",
        },
        TreeNode {
          "_nodeProps": {
            "children": "node1",
            "itemType": "branch",
            "parentValue": "__fuiTreeHelperRoot",
            "value": "node1",
          },
          "itemType": "branch",
          "parentValue": "__fuiTreeHelperRoot",
          "subtree": [
            TreeNode {
              "_nodeProps": {
                "children": "node1-1",
                "parentValue": "node1",
                "value": "node1-1",
              },
              "itemType": "leaf",
              "parentValue": "node1",
              "subtree": [],
              "value": "node1-1",
            },
          ],
          "value": "node1",
        },
      ]
    `);
  });

  it('gets the tree for render', () => {
    tree.addNode({ value: 'node1', children: 'node1', itemType: 'branch' });
    tree.addNode({
      value: 'node1-1',
      parentValue: 'node1',
      children: 'node1-1',
      itemType: 'branch',
    });
    tree.addNode({
      value: 'node1-2',
      parentValue: 'node1',
      children: 'node1-2',
    });
    tree.addNode({
      value: 'node1-1-1',
      parentValue: 'node1-1',
      children: 'node1-1-1',
    });
    tree.addNode({ value: 'node2', children: 'node2', itemType: 'branch' });
    expect(tree.getTreeForRender()).toEqual([
      {
        value: 'node1',
        children: 'node1',
        itemType: 'branch',
        subtree: [
          {
            value: 'node1-1',
            children: 'node1-1',
            itemType: 'branch',
            parentValue: 'node1',
            subtree: [
              {
                value: 'node1-1-1',
                children: 'node1-1-1',
                itemType: 'leaf',
                parentValue: 'node1-1',
                subtree: [],
              },
            ],
          },
          {
            value: 'node1-2',
            children: 'node1-2',
            itemType: 'leaf',
            parentValue: 'node1',
            subtree: [],
          },
        ],
      },
      {
        value: 'node2',
        children: 'node2',
        itemType: 'branch',
        subtree: [],
      },
    ]);
    expect(tree.getTreeForRender('node1-1')).toEqual({
      value: 'node1-1',
      children: 'node1-1',
      itemType: 'branch',
      parentValue: 'node1',
      subtree: [
        {
          value: 'node1-1-1',
          children: 'node1-1-1',
          itemType: 'leaf',
          parentValue: 'node1-1',
          subtree: [],
        },
      ],
    });
  });

  it('gets the flat tree for render', () => {
    tree.addNode({ value: 'node1', children: 'node1', itemType: 'branch' });
    tree.addNode({
      value: 'node1-1',
      parentValue: 'node1',
      children: 'node1-1',
    });
    tree.addNode({
      value: 'node1-2',
      parentValue: 'node1',
      children: 'node1-2',
      itemType: 'branch',
    });
    tree.addNode({
      value: 'node1-2-1',
      parentValue: 'node1-2',
      children: 'node1-2-1',
    });
    tree.addNode({ value: 'node2', children: 'node2', itemType: 'branch' });
    expect(tree.getFlatTreeForRender()).toEqual([
      {
        value: 'node1',
        children: 'node1',
        itemType: 'branch',
        position: 0,
      },
      {
        value: 'node1-1',
        children: 'node1-1',
        itemType: 'leaf',
        parentValue: 'node1',
        position: 0,
      },
      {
        value: 'node1-2',
        children: 'node1-2',
        itemType: 'branch',
        parentValue: 'node1',
        position: 1,
      },
      {
        value: 'node1-2-1',
        children: 'node1-2-1',
        itemType: 'leaf',
        parentValue: 'node1-2',
        position: 0,
      },
      {
        value: 'node2',
        children: 'node2',
        itemType: 'branch',
        position: 1,
      },
    ]);
    expect(tree.getFlatTreeForRender('node1-2')).toEqual([
      {
        value: 'node1-2',
        children: 'node1-2',
        itemType: 'branch',
        parentValue: 'node1',
        position: 1,
      },
      {
        value: 'node1-2-1',
        children: 'node1-2-1',
        itemType: 'leaf',
        parentValue: 'node1-2',
        position: 0,
      },
    ]);
  });
});
