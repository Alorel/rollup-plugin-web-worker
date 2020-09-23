export function createErrorThrowingCtx(): any {
  return {
    error(msg: string): never {
      throw new Error(msg);
    }
  };
}
