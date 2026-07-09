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

export const TA_LOCALES: Locales = {
  ta: {
    placeholder: 'ஆவணங்களைத் தேடுக...',
    translations: {
      button: {
        buttonText: 'தேடுக',
        buttonAriaLabel: 'தேடுக',
      },
      modal: {
        searchBox: {
          clearButtonTitle: 'தேடலை நீக்கவும்',
          clearButtonAriaLabel: 'தேடலை நீக்கவும்',
          closeButtonText: 'இரத்து செய்',
          closeButtonAriaLabel: 'இரத்து செய்',
        },
        startScreen: {
          recentSearchesTitle: 'சமீபத்திய தேடல்கள்',
          noRecentSearchesText: 'சமீபத்திய தேடல்கள் எதுவும் இல்லை',
          saveRecentSearchButtonTitle: 'தேடல் வரலாற்றில் சேர்க்கவும்',
          removeRecentSearchButtonTitle: 'தேடல் வரலாற்றிலிருந்து நீக்கவும்',
          favoriteSearchesTitle: 'பிடித்தவை',
          removeFavoriteSearchButtonTitle: 'பிடித்தவையிலிருந்து நீக்கவும்',
        },
        errorScreen: {
          titleText: 'முடிவுகளைப் பெற முடியவில்லை',
          helpText: 'உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்',
        },
        footer: {
          selectText: 'தேர்ந்தெடுக்க',
          navigateText: 'நகர்த்த',
          closeText: 'மூட',
          poweredByText: 'வழங்குபவர்',
        },
        noResultsScreen: {
          noResultsText: 'முடிவுகள் கிடைக்கவில்லை',
          suggestedQueryText: 'இவற்றைத் தேட முயற்சிக்கவும்',
          reportMissingResultsText:
            'இதற்கு முடிவுகள் கிடைத்திருக்க வேண்டும் என நினைக்கிறீர்களா?',
          reportMissingResultsLinkText: 'எங்களுக்குத் தெரியப்படுத்துங்கள்',
        },
      },
    },
  },
} as const;
// cspell:enable
