import type { StorybookConfig } from '@storybook/html-vite';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(vue());
    config.plugins.push(react());
    return config;
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
