/** @internal */
export function matchAll(regex: RegExp, input: string): RegExpExecArray[] | null {
  const out: RegExpExecArray[] = [];
  let source: string = input;
  let lastMatchIdx = -1;

  let match: RegExpExecArray | null;
  do {
    match = regex.exec(source);
    if (!match) {
      break;
    }

    if (lastMatchIdx !== -1) {
      match!.index += lastMatchIdx;
      match.input = input;
    }

    lastMatchIdx = match.index + match[0].length;
    source = input.substr(lastMatchIdx);
    out.push(match);
  } while (true); // eslint-disable-line no-constant-condition

  return out.length ? out : null;
}
