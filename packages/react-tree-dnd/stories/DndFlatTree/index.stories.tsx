import { Meta } from '@storybook/react';
import { DndFlatTree } from '@fluentui-contrib/react-tree-dnd';
export { Default } from './Default.stories';
export { ControlledOpenItems } from './ControlledOpenItems.stories';

const meta: Meta<typeof DndFlatTree> = {
  component: DndFlatTree,
};

export default meta;
