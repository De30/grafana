import React from 'react';
import { Story } from '@storybook/react';
import { Alert, Props } from './Alert';
import { withCenteredStory, withHorizontallyCenteredStory } from '../../utils/storybook/withCenteredStory';
import mdx from './Alert.mdx';

export default {
  title: 'Overlays/Alert',
  component: Alert,
  decorators: [withCenteredStory, withHorizontallyCenteredStory],
  parameters: {
    docs: {
      page: mdx,
    },
    knobs: {
      disabled: true,
    },
  },
  argTypes: {
    severity: { control: 'select' },
  },
};

const Template: Story<Props> = args => <Alert {...args} />;

export const basic = Template.bind({});
basic.args = { title: 'Some very important message', severity: 'info' };

export const withRemove = Template.bind({});
withRemove.args = {
  title: 'Some very important message',
  severity: 'info',
};
withRemove.argTypes = {
  onRemove: { action: 'Remove button clicked' },
};

export const customButtonContent = Template.bind({});
customButtonContent.args = {
  title: 'Some very important message',
  severity: 'info',
  buttonContent: <span>Close</span>,
};
customButtonContent.argTypes = {
  onRemove: { action: 'Remove button clicked' },
};
