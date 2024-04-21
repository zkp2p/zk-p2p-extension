import { RequestLog } from '../entries/Background/rpc';

export function urlify(text: string, params?: [string, string, boolean?][]): URL | null {
  try {
    const url = new URL(text);

    if (params) {
      params.forEach(([k, v]) => {
        url.searchParams.append(k, v);
      });
    }

    return url;
  } catch (e) {
    return null;
  }
}

export function devlog(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

export function download(filename: string, content: string) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export async function replayRequest(
  req: RequestLog,
): Promise<{ response: Response; text: string }> {
  const options = {
    method: req.method,
    headers: req.requestHeaders.reduce(
      // @ts-ignore
      (acc: { [key: string]: string }, h: chrome.webRequest.HttpHeader) => {
        if (typeof h.name !== 'undefined' && typeof h.value !== 'undefined') {
          acc[h.name] = h.value;
        }
        return acc;
      },
      {},
    ),
    body: req.requestBody,
  };

  if (req?.formData) {
    const formData = new URLSearchParams();
    Object.entries(req.formData).forEach(([key, values]) => {
      values.forEach((v) => formData.append(key, v));
    });
    options.body = formData.toString();
  }

  // Append a query parameter to indicate this is a replay request
  const replayUrl = new URL(req.url);
  replayUrl.searchParams.append('replay_request', '1');

  // @ts-ignore
  const resp = await fetch(replayUrl, options);
  const contentType = resp?.headers.get('content-type') || resp?.headers.get('Content-Type');

  // if (contentType?.includes('application/json')) {
  //   return {response: resp, text: resp.text();
  // } else if (contentType?.includes('text')) {
  //   return resp.text();
  // } else if (contentType?.includes('image')) {
  //   return resp.blob().then((blob) => blob.text());
  // } else {
  //   return resp.blob().then((blob) => blob.text());
  // }

  const text = await (contentType?.includes('image')
    ? resp.blob().then((blob) => blob.text())
    : resp.text());

  return { response: resp, text: text };
}