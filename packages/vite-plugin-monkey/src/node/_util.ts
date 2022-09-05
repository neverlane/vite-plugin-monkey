import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import path from 'node:path';
import { logger } from './_logger';

export const delay = async (n = 0) => {
  await new Promise<void>((res) => {
    setTimeout(res, n);
  });
};

/**
 * @link https://stackoverflow.com/questions/7616461/
 */
export const hashCode = (str = '', seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export const validUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u;
  } catch {}
};

const get_vite_start_time = () => {
  // @see https://github.com/vitejs/vite/blob/c703a3348adeaad9dc92d805a381866917f2a03b/packages/vite/src/node/server/index.ts#L741
  const n: unknown = Reflect.get(globalThis, '__vite_start_time') ?? 0;
  if (typeof n != 'number') {
    return 0;
  } else {
    return n;
  }
};

export const isFirstBoot = (n = 1000) => get_vite_start_time() < n;

export const GM_keywords = [
  'GM.addElement',
  'GM.addStyle',
  'GM.deleteValue',
  'GM.getResourceUrl',
  'GM.getValue',
  'GM.info',
  'GM.listValues',
  'GM.notification',
  'GM.openInTab',
  'GM.registerMenuCommand',
  'GM.setClipboard',
  'GM.setValue',
  'GM.xmlHttpRequest',
  'GM.cookie',
  'GM_addElement',
  'GM_addStyle',
  'GM_addValueChangeListener',
  'GM_cookie',
  'GM_deleteValue',
  'GM_download',
  'GM_getResourceText',
  'GM_getResourceURL',
  'GM_getTab',
  'GM_getTabs',
  'GM_getValue',
  'GM_info',
  'GM_listValues',
  'GM_log',
  'GM_notification',
  'GM_openInTab',
  'GM_registerMenuCommand',
  'GM_removeValueChangeListener',
  'GM_saveTab',
  'GM_setClipboard',
  'GM_setValue',
  'GM_unregisterMenuCommand',
  'GM_xmlhttpRequest',
  'unsafeWindow',
  'window.close',
  'window.focus',
  'window.onurlchange',
];
type RawPackageJson = {
  name?: string;
  version?: string;
  description?: string;
  license?: string;
  author?: string | { name: string };
  homepage?: string;
  repository?: string | { url?: string };
  bugs?: string | { url?: string };
};
type PackageJson = {
  name: string;
  version: string;
  description?: string;
  license?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  bugs?: string;
};

export const projectPkg = (() => {
  let rawTarget: RawPackageJson = {};
  try {
    rawTarget = JSON.parse(
      readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'),
    );
  } catch {
    rawTarget = {};
  }

  const target: PackageJson = {
    name: 'monkey',
    version: '1.0.0',
  };
  Object.entries(rawTarget).forEach(([k, v]) => {
    if (typeof v == 'string') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      target[k] = v;
    }
  });
  if (
    rawTarget.author instanceof Object &&
    typeof rawTarget.author?.name == 'string'
  ) {
    target.name = rawTarget.author?.name;
  }
  if (
    rawTarget.bugs instanceof Object &&
    typeof rawTarget.bugs?.url == 'string'
  ) {
    target.bugs = rawTarget.bugs?.url;
  }
  if (
    rawTarget.repository instanceof Object &&
    typeof rawTarget.repository?.url == 'string'
  ) {
    const { url } = rawTarget.repository;
    if (url.startsWith('http')) {
      target.repository = url;
    } else if (url.startsWith('git+http')) {
      target.repository = url.slice(4);
    }
  }
  return target;
})();

export const compatResolve = (() => {
  const compatRequire = createRequire(process.cwd() + '/any_filename.js');
  return (id: string) => {
    return compatRequire.resolve(id);
  };
})();

export const lazyValue = <T = unknown>(fn: () => T) => {
  const uniqueValue = Symbol('uniqueValue');
  let temp: T | symbol = uniqueValue;
  return {
    get value() {
      if (temp === uniqueValue) {
        temp = fn();
      }
      return temp as T;
    },
  };
};
export const lazy = <T extends object>(fn: () => T) => {
  let temp: T | undefined = undefined;
  let o = {
    get k() {
      if (temp === undefined) {
        temp = fn();
      }
      return temp;
    },
  };
  return new Proxy({} as T, {
    get(_, p, receiver) {
      return Reflect.get(o.k, p, receiver);
    },
    set(_, p, newValue, receiver) {
      return Reflect.set(o.k, p, newValue, receiver);
    },
    has(_, p) {
      return Reflect.has(o.k, p);
    },
    ownKeys() {
      return Reflect.ownKeys(o.k);
    },
    isExtensible() {
      return Reflect.isExtensible(o.k);
    },
    deleteProperty(_, p) {
      return Reflect.deleteProperty(o.k, p);
    },
    setPrototypeOf(_, v) {
      return Reflect.setPrototypeOf(o.k, v);
    },
    getOwnPropertyDescriptor(_, p) {
      return Reflect.getOwnPropertyDescriptor(o.k, p);
    },
    defineProperty(_, property, attributes) {
      return Reflect.defineProperty(o.k, property, attributes);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(o.k);
    },
    preventExtensions() {
      return Reflect.preventExtensions(o.k);
    },
    apply(_, thisArg, argArray) {
      // @ts-ignore
      return Reflect.apply(o.k, thisArg, argArray);
    },
    construct(_, argArray, newTarget) {
      // @ts-ignore
      return Reflect.construct(o.k, argArray, newTarget);
    },
  });
};

export const traverse = <T>(
  target: T,
  getChildren: (target: T) => T[],
  action: (target: T) => void | true,
) => {
  const stack = [target];
  while (stack.length > 0) {
    const top = stack.pop();
    if (!top) break;
    if (action(top)) {
      break;
    }
    stack.push(...getChildren(top));
  }
};

export const existFile = async (path: string) => {
  try {
    return (await fs.stat(path)).isFile();
  } catch {
    return false;
  }
};

export const getModuleRealInfo = async (name: string) => {
  let version: string | undefined = undefined;
  const nameList = name.replace('\\', '/').split('/');
  let subname = name;
  while (nameList.length > 0) {
    subname = nameList.join('/');
    const filePath = (() => {
      try {
        return compatResolve(`${subname}/package.json`);
      } catch {
        return undefined;
      }
    })();
    if (filePath === undefined || !(await existFile(filePath))) {
      nameList.pop();
      continue;
    }
    const modulePack: PackageJson = JSON.parse(
      await fs.readFile(filePath, 'utf-8'),
    );
    version = modulePack.version;
    break;
  }
  if (version === undefined) {
    logger.warn(`not found module ${name} version, use ${name}@latest`);
    version = 'latest';
  }
  return { version, name: subname };
};

export const getGzipSize = async (filePath: string | Buffer) => {
  if (filePath instanceof Buffer)
    return (await promisify(zlib.gzip)(filePath)).length;
  return fs
    .readFile(filePath)
    .then(promisify(zlib.gzip))
    .then((x) => x.length);
};

export const mergeObj = <T, S>(target: T | undefined, source: S) => {
  if (target === undefined) return { ...source } as T & S;
  const obj = { ...target };
  for (const k in source) {
    // @ts-ignore
    if (obj[k] === undefined) {
      // @ts-ignore
      obj[k] = source[k];
    }
  }
  return obj as T & S;
};
