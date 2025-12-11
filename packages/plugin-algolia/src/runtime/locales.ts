import type { DocSearchProps } from '@docsearch/react';

export type Locales = Record<
  string,
  { translations: DocSearchProps['translations']; placeholder: string }
>;

// cspell:disable
export const ZH_LOCALES: Locales = {
  zh: {
    placeholder: '搜索文档',
    translations: {
      button: {
        buttonText: '搜索',
        buttonAriaLabel: '搜索',
      },
      modal: {
        searchBox: {
          clearButtonTitle: '清除查询条件',
          clearButtonAriaLabel: '清除查询条件',
          closeButtonText: '取消',
          closeButtonAriaLabel: '取消',
        },
        startScreen: {
          recentSearchesTitle: '搜索历史',
          noRecentSearchesText: '没有搜索历史',
          saveRecentSearchButtonTitle: '保存至搜索历史',
          removeRecentSearchButtonTitle: '从搜索历史中移除',
          favoriteSearchesTitle: '收藏',
          removeFavoriteSearchButtonTitle: '从收藏中移除',
        },
        errorScreen: {
          titleText: '无法获取结果',
          helpText: '你可能需要检查你的网络连接',
        },
        footer: {
          selectText: '选择',
          navigateText: '切换',
          closeText: '关闭',
          poweredByText: '搜索提供者',
        },
        noResultsScreen: {
          noResultsText: '无法找到相关结果',
          suggestedQueryText: '你可以尝试查询',
          reportMissingResultsText: '你认为该查询应该有结果？',
          reportMissingResultsLinkText: '点击反馈',
        },
      },
    },
  },
} as const;

export const RU_LOCALES: Locales = {
  ru: {
    placeholder: 'Поиск в документации',
    translations: {
      button: {
        buttonText: 'Поиск',
        buttonAriaLabel: 'Поиск',
      },
      modal: {
        searchBox: {
          clearButtonTitle: 'Очистить поиск',
          clearButtonAriaLabel: 'Очистить поиск',
          closeButtonText: 'Закрыть',
          closeButtonAriaLabel: 'Закрыть',
        },
        startScreen: {
          recentSearchesTitle: 'История поиска',
          noRecentSearchesText: 'Нет истории поиска',
          saveRecentSearchButtonTitle: 'Сохранить в истории поиска',
          removeRecentSearchButtonTitle: 'Удалить из истории поиска',
          favoriteSearchesTitle: 'Избранное',
          removeFavoriteSearchButtonTitle: 'Удалить из избранного',
        },
        errorScreen: {
          titleText: 'Невозможно получить результаты',
          helpText: 'Проверьте подключение к Интернету',
        },
        footer: {
          selectText: 'выбрать',
          navigateText: 'перейти',
          closeText: 'закрыть',
          poweredByText: 'поиск от',
        },
        noResultsScreen: {
          noResultsText: 'Ничего не найдено',
          suggestedQueryText: 'Попробуйте изменить запрос',
          reportMissingResultsText: 'Считаете, что результаты должны быть?',
          reportMissingResultsLinkText: 'Сообщите об этом',
        },
      },
    },
  },
} as const;
// cspell:enable
