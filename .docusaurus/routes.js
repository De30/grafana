import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '11d'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '31b'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a0f'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'b89'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', 'ad4'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', 'd8e'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '540'),
    exact: true,
  },
  {
    path: '/design-system/docs',
    component: ComponentCreator('/design-system/docs', 'b81'),
    routes: [
      {
        path: '/design-system/docs/category/tutorial---basics',
        component: ComponentCreator('/design-system/docs/category/tutorial---basics', '23b'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/category/tutorial---extras',
        component: ComponentCreator('/design-system/docs/category/tutorial---extras', '0d4'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/grafana',
        component: ComponentCreator('/design-system/docs/grafana', 'f1c'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/intro',
        component: ComponentCreator('/design-system/docs/intro', '249'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/tutorial-basics/congratulations',
        component: ComponentCreator('/design-system/docs/tutorial-basics/congratulations', '479'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/tutorial-basics/create-a-blog-post',
        component: ComponentCreator('/design-system/docs/tutorial-basics/create-a-blog-post', '445'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/tutorial-basics/create-a-document',
        component: ComponentCreator('/design-system/docs/tutorial-basics/create-a-document', '60b'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/tutorial-basics/create-a-page',
        component: ComponentCreator('/design-system/docs/tutorial-basics/create-a-page', 'e3e'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/tutorial-basics/deploy-your-site',
        component: ComponentCreator('/design-system/docs/tutorial-basics/deploy-your-site', '3c7'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/tutorial-basics/markdown-features',
        component: ComponentCreator('/design-system/docs/tutorial-basics/markdown-features', '9bb'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/tutorial-extras/manage-docs-versions',
        component: ComponentCreator('/design-system/docs/tutorial-extras/manage-docs-versions', '42e'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
      {
        path: '/design-system/docs/tutorial-extras/translate-your-site',
        component: ComponentCreator('/design-system/docs/tutorial-extras/translate-your-site', '7fa'),
        exact: true,
        sidebar: 'tutorialSidebar',
      },
    ],
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
