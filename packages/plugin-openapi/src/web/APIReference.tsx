import { CodeBlockRuntime, Tabs, Tab } from '@rspress/core/theme';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  getOperations,
  mediaExample,
  resolveRef,
  schemaExample,
} from '../model';
import type { OpenAPIDocument, OperationData, Schema } from '../types';
import { Disclosure } from './Disclosure';
import { prepareRequest, serverURL, type RequestInput } from './request';
import { generateSnippet, languages, type Language } from './snippets';

export interface APIReferenceProps {
  document: OpenAPIDocument;
  operationId: string;
  playground?: boolean;
  showTitle?: boolean;
}
function display(value: unknown): string {
  return value === undefined ? '' : JSON.stringify(value, null, 2);
}
function SchemaView({
  document,
  schema: raw,
  depth = 0,
}: {
  document: OpenAPIDocument;
  schema: Schema;
  depth?: number;
}) {
  const schema = resolveRef(document, raw);
  if (depth > 5)
    return (
      <p className="rp-openapi-muted">
        Recursive schema{raw.$ref ? `: ${raw.$ref.split('/').pop()}` : ''}
      </p>
    );
  return (
    <div className="rp-openapi-schema">
      <code>
        {Array.isArray(schema.type)
          ? schema.type.join(' | ')
          : (schema.type ?? (schema.properties ? 'object' : 'schema'))}
      </code>
      {schema.format && (
        <span className="rp-openapi-chip">{schema.format}</span>
      )}
      {schema.nullable && <span className="rp-openapi-chip">nullable</span>}
      {schema.description && <p>{schema.description}</p>}
      {schema.enum && (
        <p>
          Enum:{' '}
          <code>
            {schema.enum.map(value => JSON.stringify(value)).join(' | ')}
          </code>
        </p>
      )}
      {schema.default !== undefined && (
        <p>
          Default: <code>{display(schema.default)}</code>
        </p>
      )}
      {Object.entries(schema.properties ?? {}).map(([name, property]) => (
        <Disclosure
          key={name}
          title={
            <>
              <code>{name}</code>
              {schema.required?.includes(name) && (
                <>
                  {' '}
                  <span className="rp-openapi-required">required</span>
                </>
              )}
            </>
          }
        >
          <SchemaView document={document} schema={property} depth={depth + 1} />
        </Disclosure>
      ))}
      {schema.items && (
        <Disclosure title="Array items">
          <SchemaView
            document={document}
            schema={schema.items}
            depth={depth + 1}
          />
        </Disclosure>
      )}
      {(['allOf', 'oneOf', 'anyOf'] as const).map(kind =>
        schema[kind]?.map((part, index) => (
          <Disclosure key={`${kind}-${index}`} title={`${kind} · ${index + 1}`}>
            <SchemaView document={document} schema={part} depth={depth + 1} />
          </Disclosure>
        )),
      )}
    </div>
  );
}
function CodePanel({
  text,
  title,
  lang = 'json',
}: {
  text: string;
  title?: string;
  lang?: string;
}) {
  return (
    <div className="rp-openapi-code">
      <CodeBlockRuntime
        code={text || 'No response body'}
        title={title}
        lang={text ? lang : 'text'}
        wrapCode={false}
      />
    </div>
  );
}
export function APIReference(props: APIReferenceProps) {
  const data = useMemo(
    () =>
      getOperations(props.document).find(item => item.id === props.operationId),
    [props.document, props.operationId],
  );
  if (!data) return <p role="alert">Unknown operation: {props.operationId}</p>;
  return <OperationReference key={props.operationId} {...props} data={data} />;
}
function OperationReference({
  document,
  data,
  playground = true,
  showTitle = true,
}: APIReferenceProps & { data: OperationData }) {
  const id = useId();
  const requestBody =
    data.operation.requestBody &&
    resolveRef(document, data.operation.requestBody);
  const contents = requestBody?.content ?? {};
  const [input, setInput] = useState<RequestInput>(() => {
    const mediaType = Object.keys(contents)[0] ?? '';
    return {
      server: serverURL(data.servers[0]),
      values: Object.fromEntries(
        data.parameters.map(parameter => {
          const schema = resolveRef(document, parameter.schema ?? {});
          const value =
            parameter.example ??
            schema.example ??
            schema.default ??
            (parameter.required ? schemaExample(document, schema) : undefined);
          return [
            `${parameter.in}:${parameter.name}`,
            value === undefined
              ? ''
              : typeof value === 'string'
                ? value
                : display(value),
          ];
        }),
      ),
      body: display(mediaExample(document, contents[mediaType])),
      mediaType,
      auth: {},
      securityIndex: 0,
    };
  });
  const [language, setLanguage] = useState<Language>('cURL');
  const [result, setResult] = useState<{
    status: string;
    body: string;
    headers: string;
    elapsed: number;
  }>();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const preview = useMemo(() => {
    try {
      return { request: prepareRequest(document, data, input), error: '' };
    } catch (error) {
      return { request: undefined, error: (error as Error).message };
    }
  }, [document, data, input]);
  const snippet = useMemo(() => {
    if (!preview.request) return preview.error;
    try {
      return generateSnippet(preview.request, language);
    } catch {
      return 'Unable to generate this example.';
    }
  }, [preview, language]);
  const responses = Object.entries(data.operation.responses ?? {}).map(
    ([status, response]) => [status, resolveRef(document, response)] as const,
  );
  const [responseStatus, setResponseStatus] = useState(responses[0]?.[0] ?? '');
  const response = responses.find(([status]) => status === responseStatus)?.[1];
  const responseContents = response?.content ?? {};
  const [responseMedia, setResponseMedia] = useState('');
  const selectedMedia = responseContents[responseMedia]
    ? responseMedia
    : Object.keys(responseContents)[0];
  async function send() {
    if (!preview.request) {
      setError(preview.error);
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 30_000);
    setPending(true);
    setError('');
    setResult(undefined);
    const start = performance.now();
    try {
      const request = preview.request;
      const response = await fetch(new URL(request.url, window.location.href), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: abort.signal,
        credentials: 'omit',
      });
      const text = await response.text();
      let body = text;
      try {
        body = display(JSON.parse(text));
      } catch {
        /* Keep non-JSON responses as text. */
      }
      setResult({
        status: `${response.status} ${response.statusText}`,
        body,
        headers: [...response.headers]
          .map(([name, value]) => `${name}: ${value}`)
          .join('\n'),
        elapsed: Math.round(performance.now() - start),
      });
    } catch (error) {
      setError(
        abort.signal.aborted
          ? 'Request cancelled or timed out.'
          : `${(error as Error).message}. Check the server URL, network connection and API CORS settings.`,
      );
    } finally {
      clearTimeout(timeout);
      setPending(false);
      controller.current = null;
    }
  }
  return (
    <div className="rp-openapi">
      {showTitle && <h1>{data.operation.summary ?? data.id}</h1>}
      {data.operation.deprecated && (
        <p className="rp-openapi-required">Deprecated operation</p>
      )}
      <div className="rp-openapi-columns">
        <div className="rp-openapi-main">
          {import.meta.env.SSG_MD ? (
            <p>
              <strong>{data.method.toUpperCase()}</strong>{' '}
              <code>
                {input.server}
                {data.path}
              </code>
            </p>
          ) : (
            <section className="rp-openapi-playground" aria-label="API request">
              <label className="rp-openapi-server">
                Server URL
                <input
                  aria-label="Server URL"
                  list={`${id}-servers`}
                  value={input.server}
                  onChange={event =>
                    setInput({ ...input, server: event.target.value })
                  }
                />
              </label>
              <datalist id={`${id}-servers`}>
                {data.servers.map(server => (
                  <option key={server.url} value={serverURL(server)}>
                    {server.description}
                  </option>
                ))}
              </datalist>
              <div className="rp-openapi-endpoint">
                <span className={`rp-openapi-method rp-openapi-${data.method}`}>
                  {data.method.toUpperCase()}
                </span>
                <code>{data.path}</code>
                {playground && (
                  <button
                    className="rp-openapi-send"
                    type="button"
                    onClick={pending ? () => controller.current?.abort() : send}
                  >
                    {pending ? 'Cancel' : 'Send'}
                  </button>
                )}
              </div>
              {playground && (
                <>
                  {data.parameters.length > 0 && (
                    <Disclosure embedded title="Parameters">
                      <div className="rp-openapi-fields">
                        {data.parameters.map(parameter => (
                          <label key={`${parameter.in}:${parameter.name}`}>
                            {parameter.name}{' '}
                            <small>
                              {parameter.in}
                              {parameter.required ? ' · required' : ''}
                            </small>
                            <input
                              aria-label={`${parameter.in} ${parameter.name}`}
                              value={
                                input.values[
                                  `${parameter.in}:${parameter.name}`
                                ] ?? ''
                              }
                              onChange={event =>
                                setInput({
                                  ...input,
                                  values: {
                                    ...input.values,
                                    [`${parameter.in}:${parameter.name}`]:
                                      event.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </Disclosure>
                  )}
                  {data.security.length > 0 && (
                    <Disclosure embedded title="Authorization">
                      <div className="rp-openapi-fields">
                        <select
                          aria-label="Security requirement"
                          value={input.securityIndex}
                          onChange={event =>
                            setInput({
                              ...input,
                              securityIndex: Number(event.target.value),
                            })
                          }
                        >
                          {data.security.map((requirement, index) => (
                            <option key={index} value={index}>
                              {Object.keys(requirement).join(' + ') ||
                                'No authentication'}
                            </option>
                          ))}
                        </select>
                        {Object.keys(
                          data.security[input.securityIndex] ?? {},
                        ).map(name => (
                          <label key={name}>
                            {name}
                            <input
                              type="password"
                              autoComplete="off"
                              value={input.auth[name] ?? ''}
                              onChange={event =>
                                setInput({
                                  ...input,
                                  auth: {
                                    ...input.auth,
                                    [name]: event.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                        ))}
                        <small>
                          For OAuth, paste an access token. For Basic, enter
                          username:password.
                        </small>
                      </div>
                    </Disclosure>
                  )}
                  {requestBody && (
                    <Disclosure embedded title="Request body">
                      <div className="rp-openapi-fields">
                        <select
                          aria-label="Request content type"
                          value={input.mediaType}
                          onChange={event =>
                            setInput({
                              ...input,
                              mediaType: event.target.value,
                              body: display(
                                mediaExample(
                                  document,
                                  contents[event.target.value],
                                ),
                              ),
                            })
                          }
                        >
                          {Object.keys(contents).map(type => (
                            <option key={type}>{type}</option>
                          ))}
                        </select>
                        <textarea
                          aria-label="Request body"
                          rows={8}
                          value={input.body}
                          onChange={event =>
                            setInput({ ...input, body: event.target.value })
                          }
                        />
                      </div>
                    </Disclosure>
                  )}
                </>
              )}
              {error && (
                <p role="alert" className="rp-openapi-error">
                  {error}
                </p>
              )}
              {pending && <p role="status">Sending request…</p>}
            </section>
          )}
          {data.operation.description && (
            <p className="rp-openapi-description">
              {data.operation.description}
            </p>
          )}
          {(['path', 'query', 'header', 'cookie'] as const).map(location => {
            const parameters = data.parameters.filter(
              parameter => parameter.in === location,
            );
            return (
              parameters.length > 0 && (
                <section key={location}>
                  <h2>
                    {location[0].toUpperCase() + location.slice(1)} parameters
                  </h2>
                  {parameters.map(parameter => (
                    <div key={parameter.name} className="rp-openapi-parameter">
                      <h3>
                        <code>{parameter.name}</code>
                        {parameter.required && (
                          <span className="rp-openapi-required">required</span>
                        )}
                      </h3>
                      <p>{parameter.description}</p>
                      <SchemaView
                        document={document}
                        schema={parameter.schema ?? {}}
                      />
                    </div>
                  ))}
                </section>
              )
            );
          })}
          {requestBody && (
            <section>
              <h2>Request body</h2>
              <p>{requestBody.description}</p>
              {Object.entries(contents).map(([type, media]) => (
                <Disclosure key={type} defaultOpen title={type}>
                  {media.schema && (
                    <SchemaView document={document} schema={media.schema} />
                  )}
                </Disclosure>
              ))}
            </section>
          )}
          <section>
            <h2>Response body</h2>
            {responses.map(([status, response]) => (
              <Disclosure
                key={status}
                title={
                  <>
                    <code>{status}</code> {response.description}
                  </>
                }
              >
                {Object.entries(response.content ?? {}).map(([type, media]) => (
                  <div key={type}>
                    <p>
                      <code>{type}</code>
                    </p>
                    {media.schema && (
                      <SchemaView document={document} schema={media.schema} />
                    )}
                  </div>
                ))}
              </Disclosure>
            ))}
          </section>
        </div>
        {import.meta.env.SSG_MD ? (
          <section>
            <h2>Request example</h2>
            <CodePanel text={snippet} lang="bash" />
            <h2>Response examples</h2>
            {responses.map(([status, response]) => (
              <section key={status}>
                <h3>{status}</h3>
                {Object.entries(response.content ?? {}).map(([type, media]) => {
                  const example = mediaExample(document, media);
                  return example === undefined ? null : (
                    <div key={type}>
                      <p>
                        <code>{type}</code>
                      </p>
                      <CodePanel text={display(example)} />
                    </div>
                  );
                })}
              </section>
            ))}
          </section>
        ) : (
          <aside
            className="rp-openapi-examples"
            aria-label="Request and response examples"
          >
            <Tabs
              className="rp-openapi-samples"
              keepDOM={false}
              onChange={index => setLanguage(languages[index])}
            >
              {languages.map(item => (
                <Tab
                  key={item}
                  value={item}
                  label={
                    <button
                      type="button"
                      className="rp-openapi-tab-label"
                      aria-pressed={language === item}
                    >
                      {item}
                    </button>
                  }
                >
                  <CodePanel
                    text={language === item ? snippet : ''}
                    lang={
                      {
                        cURL: 'bash',
                        JavaScript: 'javascript',
                        Go: 'go',
                        Python: 'python',
                        Java: 'java',
                        'C#': 'csharp',
                        Rust: 'rust',
                      }[item]
                    }
                  />
                </Tab>
              ))}
            </Tabs>
            <Tabs
              className="rp-openapi-samples"
              keepDOM={false}
              onChange={index => setResponseStatus(responses[index][0])}
            >
              {responses.map(([status]) => (
                <Tab
                  key={status}
                  value={status}
                  label={
                    <button
                      type="button"
                      className="rp-openapi-tab-label"
                      aria-pressed={responseStatus === status}
                    >
                      {status}
                    </button>
                  }
                >
                  <div className="rp-openapi-response-meta">
                    <span>Response example</span>
                    {Object.keys(responseContents).length > 0 && (
                      <select
                        aria-label="Response content type"
                        value={selectedMedia ?? ''}
                        onChange={event => setResponseMedia(event.target.value)}
                      >
                        {Object.keys(responseContents).map(type => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <CodePanel
                    text={display(
                      mediaExample(document, responseContents[selectedMedia]),
                    )}
                  />
                </Tab>
              ))}
            </Tabs>
            {result && (
              <div className="rp-openapi-panel" role="status">
                <CodePanel
                  title={`${result.status} · ${result.elapsed} ms`}
                  text={result.body}
                />
                <Disclosure embedded title="Response headers">
                  <pre>{result.headers}</pre>
                </Disclosure>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
