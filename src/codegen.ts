import { existsSync } from 'node:fs';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { genHas, getInterfaceName, isArray, isObject, request } from './utils';

import type { Config, TypeContext } from '../types';

const CACHED_PATH = resolve(process.cwd(), 'node_modules/.fetch-json-to-ts-cached.json');
let cached: Record<string, string> = {};

export async function fetchJsonToTs(config: Config) {
  const instance = request(config);
  const map = new Map();
  const APIS = config.apis.map((value, i) => {
    if (isObject(value)) {
      map.set(i, value.name);
      return instance.get(value.api);
    }
    return instance.get(value);
  });
  const responses = await Promise.allSettled(APIS);

  const filePaths = [];

  for (let i = 0; i < responses.length; i++) {
    const res = responses[i];
    if (res.status === 'rejected') {
      console.log(`\x1B[31m${res.reason.url}\x1B[0m 接口请求失败`);
      console.log(`\x1B[31m${JSON.stringify(res.reason, null, 2)}\x1B[0m`);
    } else {
      const name = getInterfaceName(res.value.url ?? '');
      const path = await generateInterface(res.value.data, name, config);
      console.log(`\x1B[32m${path}\x1B[0m 类型文件生成成功`);
      filePaths.push(path);
    }
  }

  writeFile(CACHED_PATH, JSON.stringify(cached, null, 2), 'utf-8');
}

export function createTypeContext() {
  const context: TypeContext = {
    code: '',
    indentLevel: 0,
    push(code: string) {
      context.code += code;
    },
    newline() {
      newline(context.indentLevel);
    },
    indent() {
      newline(++context.indentLevel);
    },
    deindent() {
      newline(--context.indentLevel);
    }
  };

  function newline(n: number) {
    context.push(`\n${'  '.repeat(n)}`);
  }

  return context;
}

export async function generateInterface(data: any, name: string, config: Config) {
  const context = createTypeContext();
  const dataIsArray = isArray(data);
  const { push, newline } = context;

  name = name.charAt(0).toUpperCase() + name.slice(1);

  if (dataIsArray) {
    if (data.length) {
      push(`export type ${name}Type = Array<${name}>;\n`);
      newline();
      push(`export interface ${name} `);
      transform(data[0], context, name);
    } else {
      push(`export type ${name}Type = Array<any>`);
    }
  } else {
    push(`export interface ${name}Type `);
    transform(data, context, name);
  }
  newline();

  const dir = resolve(process.cwd(), `${config.typePath ?? ''}`);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const filePath = resolve(`${dir}/${name}.d.ts`);

  if (existsSync(filePath)) {
    const fileHash = await genHas(filePath);
    if (existsSync(CACHED_PATH) && !Object.keys(cached).length) {
      let data = await readFile(CACHED_PATH, 'utf-8');
      cached = data ? JSON.parse(data) : {};
    }
    if (cached[filePath] === fileHash) {
      return filePath;
    } else {
      cached[filePath] = fileHash;
    }
  }

  await writeFile(filePath, context.code, 'utf-8');
  return filePath;
}

export function transform(data: any, context: TypeContext, name?: string) {
  const { push, newline, indent, deindent } = context;
  const childType = [];

  if (isArray(data)) {
    if (data.length) {
      push('[');
      for (let i = 0; i < data.length; i++) {
        transform(data[i], context);
        if (i < data.length - 1) {
          push(', ');
        }
      }
      push(']');
    }
  } else if (isObject(data)) {
    push('{');
    indent();
    const entries = Object.entries(data);
    for (let i = 0; i < entries.length; i++) {
      const key = entries[i][0];
      const value = entries[i][1];
      push(`${key}${value === null || value === '' ? '?' : ''}: `);

      if (isArray(value)) {
        if (value.length) {
          const itemName = `${name}Item`;
          if (Object.keys(value[0]).length <= 5) {
            push('Array<');
            transform(value[0], context, itemName);
            push('>');
          } else {
            push(`Array<${itemName}>`);
            const childContext = createTypeContext();
            childType.push({
              name: itemName,
              value: transform(value[0], childContext, itemName)
            });
          }
        } else {
          push('Array<any>');
        }
      } else {
        push(`${value === null ? 'unknown' : typeof value}`);
      }

      if (i < entries.length - 1) {
        push(',');
        newline();
      }
    }

    deindent();
    push('}');
  } else {
    push(`${data === null ? 'unknown' : typeof data}`);
  }

  for (let i = 0; i < childType.length; i++) {
    newline();
    newline();
    push(`export interface ${childType[i].name} `);
    push(childType[i].value);
  }

  return context.code;
}
