import type { OgImageTemplateData } from './types';

/**
 * Default OG image template
 * Returns a React-like JSX structure that Satori can render
 */
export function defaultTemplate(data: OgImageTemplateData): any {
  const {
    title,
    description,
    siteName = 'Rspress',
    backgroundColor = '#1a1a1a',
    textColor = '#ffffff',
  } = data;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor,
        padding: '80px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      },
      children: [
        // Main content
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
            },
            children: [
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '72px',
                    fontWeight: 'bold',
                    color: textColor,
                    lineHeight: 1.2,
                    marginBottom: '24px',
                    maxWidth: '900px',
                    display: 'flex',
                    flexWrap: 'wrap',
                  },
                  children: title,
                },
              },
              // Description
              description
                ? {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '32px',
                        color: textColor,
                        opacity: 0.8,
                        lineHeight: 1.4,
                        maxWidth: '900px',
                      },
                      children: description,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        // Footer with site name
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '28px',
              color: textColor,
              opacity: 0.7,
            },
            children: siteName,
          },
        },
      ],
    },
  };
}
