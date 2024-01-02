import http from 'node:http';
import https from 'node:https';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';

import type { Config } from '../types';

export const isArray = (value: unknown): value is Array<any> => {
  return Array.isArray(value);
};

export const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

export const mergeRequestConfig = ({ headers = {}, baseURL = '/', token }: Config) => {
  const config = {
    baseURL,
    headers
  };
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (headers) {
    config.headers = headers;
  }
  return config;
};

let index = 0;
export const getInterfaceName = (url: string) => {
  if (url === '') return `Anonymous${++index}`;

  return url
    .slice(1)
    .split('/')
    .filter((n: string) => !Number.isInteger(Number(n)))
    .map((n: string) => n.charAt(0).toUpperCase() + n.slice(1))
    .join('');
};

export const request = (config: Config) => {
  const isHttps = config.baseURL?.startsWith('https');
  const instance = isHttps ? https : http;
  const _config = mergeRequestConfig(config);

  const get = (url: string) => {
    let response = '';
    const _url = `${config.baseURL}/${url[0] === '/' ? url.slice(1) : url}`;
    return new Promise<{ url: string; data: any }>((resolve, reject) => {
      instance
        .get(
          _url,
          {
            headers: _config.headers
          },
          (res) => {
            const { statusCode, statusMessage } = res;
            if (res.statusCode && res.statusCode >= 400) {
              res.resume();
              reject({ url, data: { statusCode, statusMessage } });
              return;
            }

            res.on('data', (chunk) => (response += chunk));
            res.on('end', () => {
              resolve({
                url,
                data: JSON.parse(response)
              });
            });
          }
        )
        .on('error', (err) => {
          reject({ url, data: err });
        });
    });
  };

  return { get };
};

export function genHas(filePath: string) {
  const stream = createReadStream(filePath);
  const hash = createHash('sha256');

  return new Promise<string>((resolve) => {
    stream.on('readable', () => {
      const data = stream.read();
      if (data) {
        hash.update(data);
      } else {
        resolve(hash.digest('hex').slice(0, 8));
      }
    });
  });
}
