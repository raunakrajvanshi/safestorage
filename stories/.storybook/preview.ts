import type { Preview } from '@storybook/html';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f172a' },
        { name: 'light', value: '#f8fafc' },
      ],
    },
    layout: 'padded',
  },
};

export default preview;
