function internalReadFromObject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  object: Record<string, any>,
  key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const parts = key.split('.', 2);
  if (parts.length === 1) {
    // there is no sublevel more to read
    return object[parts[0]];
  }
  // the key demands more sublevels
  if (object[parts[0]]) {
    return internalReadFromObject(object[parts[0]], parts[1]);
  }
  return undefined;
}

export function readFromObject<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  object: Record<string, any>,
  key: string,
  defaultVal: T
): T {
  const val = internalReadFromObject(object, key);
  if (val !== undefined) {
    return val as T;
  }
  return defaultVal;
}
