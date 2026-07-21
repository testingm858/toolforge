// Hash Generator — Web Crypto API (works in Node.js and browser)

type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export async function generateHash(input: string, algorithm: HashAlgorithm = "SHA-256"): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function generateAllHashes(input: string): Promise<Record<string, string>> {
  const [sha1, sha256, sha384, sha512] = await Promise.all([
    generateHash(input, "SHA-1"),
    generateHash(input, "SHA-256"),
    generateHash(input, "SHA-384"),
    generateHash(input, "SHA-512"),
  ]);
  // The tool's own listing promises MD5 ("Generate MD5, SHA-1, SHA-256 and
  // SHA-512 hashes") but there's no UI algorithm selector to reach the
  // separate algorithm:"md5" request path in route.ts — MD5 was silently
  // unreachable. Folding it into the default all-hashes result is what
  // actually delivers on what the tool claims to do.
  return { MD5: md5(input), "SHA-1": sha1, "SHA-256": sha256, "SHA-384": sha384, "SHA-512": sha512 };
}

// Simple MD5 — pure JS implementation (no crypto needed)
export function md5(input: string): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const bytes = new TextEncoder().encode(input);
  // Standard MD5 padding: append 0x80, zero-pad, then an 8-byte bit-length
  // field, rounding up to the next 64-byte block boundary. The previous
  // fixed "+64+8" allocation wasn't guaranteed to land on a multiple of 64
  // (e.g. 5 input bytes -> 77, not 64 or 128) — the block loop below then
  // read past the buffer's end on its second iteration, throwing "Offset
  // is outside the bounds of the DataView" for almost any real input.
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const msg = new Uint8Array(paddedLength);
  msg.set(bytes);
  msg[bytes.length] = 0x80;
  const view = new DataView(msg.buffer);
  view.setUint32(paddedLength - 8, bytes.length * 8, true);

  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  for (let i = 0; i < msg.length; i += 64) {
    const M: number[] = [];
    for (let j = 0; j < 16; j++) M.push(view.getUint32(i + j * 4, true));
    const [aa, bb, cc, dd] = [a, b, c, d];
    // Round 1
    a=md5ff(a,b,c,d,M[0],7,-680876936);d=md5ff(d,a,b,c,M[1],12,-389564586);c=md5ff(c,d,a,b,M[2],17,606105819);b=md5ff(b,c,d,a,M[3],22,-1044525330);
    a=md5ff(a,b,c,d,M[4],7,-176418897);d=md5ff(d,a,b,c,M[5],12,1200080426);c=md5ff(c,d,a,b,M[6],17,-1473231341);b=md5ff(b,c,d,a,M[7],22,-45705983);
    a=md5ff(a,b,c,d,M[8],7,1770035416);d=md5ff(d,a,b,c,M[9],12,-1958414417);c=md5ff(c,d,a,b,M[10],17,-42063);b=md5ff(b,c,d,a,M[11],22,-1990404162);
    a=md5ff(a,b,c,d,M[12],7,1804603682);d=md5ff(d,a,b,c,M[13],12,-40341101);c=md5ff(c,d,a,b,M[14],17,-1502002290);b=md5ff(b,c,d,a,M[15],22,1236535329);
    // Round 2
    a=md5gg(a,b,c,d,M[1],5,-165796510);d=md5gg(d,a,b,c,M[6],9,-1069501632);c=md5gg(c,d,a,b,M[11],14,643717713);b=md5gg(b,c,d,a,M[0],20,-373897302);
    a=md5gg(a,b,c,d,M[5],5,-701558691);d=md5gg(d,a,b,c,M[10],9,38016083);c=md5gg(c,d,a,b,M[15],14,-660478335);b=md5gg(b,c,d,a,M[4],20,-405537848);
    a=md5gg(a,b,c,d,M[9],5,568446438);d=md5gg(d,a,b,c,M[14],9,-1019803690);c=md5gg(c,d,a,b,M[3],14,-187363961);b=md5gg(b,c,d,a,M[8],20,1163531501);
    a=md5gg(a,b,c,d,M[13],5,-1444681467);d=md5gg(d,a,b,c,M[2],9,-51403784);c=md5gg(c,d,a,b,M[7],14,1735328473);b=md5gg(b,c,d,a,M[12],20,-1926607734);
    // Round 3
    a=md5hh(a,b,c,d,M[5],4,-378558);d=md5hh(d,a,b,c,M[8],11,-2022574463);c=md5hh(c,d,a,b,M[11],16,1839030562);b=md5hh(b,c,d,a,M[14],23,-35309556);
    a=md5hh(a,b,c,d,M[1],4,-1530992060);d=md5hh(d,a,b,c,M[4],11,1272893353);c=md5hh(c,d,a,b,M[7],16,-155497632);b=md5hh(b,c,d,a,M[10],23,-1094730640);
    a=md5hh(a,b,c,d,M[13],4,681279174);d=md5hh(d,a,b,c,M[0],11,-358537222);c=md5hh(c,d,a,b,M[3],16,-722521979);b=md5hh(b,c,d,a,M[6],23,76029189);
    a=md5hh(a,b,c,d,M[9],4,-640364487);d=md5hh(d,a,b,c,M[12],11,-421815835);c=md5hh(c,d,a,b,M[15],16,530742520);b=md5hh(b,c,d,a,M[2],23,-995338651);
    // Round 4
    a=md5ii(a,b,c,d,M[0],6,-198630844);d=md5ii(d,a,b,c,M[7],10,1126891415);c=md5ii(c,d,a,b,M[14],15,-1416354905);b=md5ii(b,c,d,a,M[5],21,-57434055);
    a=md5ii(a,b,c,d,M[12],6,1700485571);d=md5ii(d,a,b,c,M[3],10,-1894986606);c=md5ii(c,d,a,b,M[10],15,-1051523);b=md5ii(b,c,d,a,M[1],21,-2054922799);
    a=md5ii(a,b,c,d,M[8],6,1873313359);d=md5ii(d,a,b,c,M[15],10,-30611744);c=md5ii(c,d,a,b,M[6],15,-1560198380);b=md5ii(b,c,d,a,M[13],21,1309151649);
    a=md5ii(a,b,c,d,M[4],6,-145523070);d=md5ii(d,a,b,c,M[11],10,-1120210379);c=md5ii(c,d,a,b,M[2],15,718787259);b=md5ii(b,c,d,a,M[9],21,-343485551);

    a=safeAdd(a,aa); b=safeAdd(b,bb); c=safeAdd(c,cc); d=safeAdd(d,dd);
  }

  const result = new Uint8Array(16);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, a, true); rv.setUint32(4, b, true);
  rv.setUint32(8, c, true); rv.setUint32(12, d, true);
  return Array.from(result).map(b => b.toString(16).padStart(2,"0")).join("");
}
