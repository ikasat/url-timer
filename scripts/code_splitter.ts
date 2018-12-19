import * as fs from "fs";
import * as path from "path";

const outDir = process.argv[2] || "out";

const readStdin = (): Promise<string> =>
  new Promise((resolve, reject) => {
    let input = "";
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => {
      input += chunk;
    });
    process.stdin.on("end", () => {
      resolve(input);
    });
    process.stdin.on("error", err => {
      reject(err);
    });
  });

const convertHeadingToFileName = (ss: string[]) =>
  ss
    .join("_")
    .replace(/[^0-9a-zA-Z_]+/g, "-")
    .toLowerCase();

const dump = (heading: string[], s: string, prefix?: string): boolean => {
  let trimmed = s.replace(/^\n+/, "").replace(/\n+$/, "");
  if (trimmed.length === 0) {
    return false;
  }
  const fileName = (prefix || "") + convertHeadingToFileName(heading);
  const content = trimmed + "\n";
  fs.writeFileSync(path.join(outDir, fileName + ".txt"), content);
  return true;
};

(async () => {
  const input = await readStdin();
  let heading = [] as string[];
  let s = "";
  let count = 0;
  for (let line of input.split("\n")) {
    const m = line.match(/^(.*?)\s*\/\/\s*##(#*)\s*(.+)$/);
    if (m != null) {
      const [_all, rest, hash, title] = m;
      s += rest;
      if (dump(heading, s)) {
        ++count;
      }
      s = "";
      heading[hash.length] = title;
      heading = heading.slice(0, hash.length + 1);
    } else {
      s += line + "\n";
    }
  }
  if (dump(heading, s)) {
    ++count;
  }
  console.log(`${count} sections were dumped.`);
})();
