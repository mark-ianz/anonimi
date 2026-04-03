import "express";

declare global {
  namespace Express {
    interface ParamsDictionary {
      [key: string]: string;
    }
  }
}

declare module "express-serve-static-core" {
  interface ParamsDictionary {
    [key: string]: string;
  }
}
