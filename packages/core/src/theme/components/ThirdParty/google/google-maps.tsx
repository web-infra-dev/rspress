// cspell:ignore streetview maptype

import { GoogleMapsEmbed as TPCGoogleMapEmbed } from 'third-party-capital';

import ThirdPartyScriptEmbed from '../ThirdPartyScripts';

export type GoogleMapsEmbedTypes = {
  height?: number | string;
  width?: number | string;
  mode: 'place' | 'view' | 'directions' | 'streetview' | 'search';
  apiKey: string;
  style?: string;
  allowfullscreen?: boolean;
  loading?: 'eager' | 'lazy';
  q?: string;
  id?: string;
  center?: string;
  zoom?: string;
  maptype?: string;
  language?: string;
  region?: string;
};

export function GoogleMapsEmbed(props: GoogleMapsEmbedTypes) {
  const { apiKey, ...restProps } = props;
  const formattedProps = { ...restProps, key: apiKey };
  const { html } = TPCGoogleMapEmbed(formattedProps);

  return (
    <ThirdPartyScriptEmbed
      height={formattedProps.height || null}
      width={formattedProps.width || null}
      html={html}
    />
  );
}
