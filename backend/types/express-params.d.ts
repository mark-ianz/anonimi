declare global {
  namespace Express {
    interface ParamsDictionary {
      [key: string]: string | string[];
    }
  }
}

export {};
