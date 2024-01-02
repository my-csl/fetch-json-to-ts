# fetch-json-to-ts

## 获取接口数据生成 typescript 类型文件

### Example

```shell
npm install fetch-json-to-ts
```

```ts
import { fetchJsonToTs } from 'fetch-json-to-ts';

/**
 * typePath 默认的cwd是命令运行时的cwd
 */
fetchJsonToTs({
  baseURL: 'https://example.api.com',
  token: 'xxxxxx',
  typePath: 'src/types'
  apis: [
    '/members',
    {
      name: 'Departments',
      api: '/departments'
    }
  ]
});
```
