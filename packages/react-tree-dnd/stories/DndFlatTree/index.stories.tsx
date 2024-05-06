import { Meta } from '@storybook/react';
import { FlatTree } from '@fluentui/react-components';
export { Default } from './Default.stories';
export { ControlledOpenItems } from './ControlledOpenItems.stories';
export { Virtualized } from './Virtualized.stories';

const meta: Meta<typeof FlatTree> = {
  component: FlatTree,
};

export default meta;
