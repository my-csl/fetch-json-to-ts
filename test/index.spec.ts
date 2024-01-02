import { describe, test, expect } from 'vitest';
import { createTypeContext, transform } from '../src/codegen';

describe('fetch-json-to-ts', () => {
  test('简单元组测试', () => {
    const context = createTypeContext();
    const str = transform([18, 'cc'], context);
    expect(str).toBe(`[number, string]`);
  });

  test('复杂元组测试', () => {
    const context = createTypeContext();
    const str = transform([18, 'cc', { age: 18, name: 'cc' }], context);
    const result = `[number, string, {\n  age: number,\n  name: string\n}]`;
    expect(str).toBe(result);
  });

  test('json测试1', () => {
    const context = createTypeContext();
    const str = transform({ name: 'cc', age: 18 }, context);
    const result = '{\n  name: string,\n  age: number\n}';
    expect(str).toBe(result);
  });

  test('json测试2', () => {
    const context = createTypeContext();
    const str = transform({ name: 'cc', age: 18, hobbit: [{ name: '唱歌', num: 70 }] }, context);
    const result =
      '{\n  name: string,\n  age: number,\n  hobbit: Array<{\n    name: string,\n    num: number\n  }>\n}';
    expect(str).toBe(result);
  });
});
