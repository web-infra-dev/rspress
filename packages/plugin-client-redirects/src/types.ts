export type RedirectRule = {
  to: string;
  from: string | string[];
};

export type RedirectsOptions = {
  redirects?: RedirectRule[];
};
