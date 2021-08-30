const fs = require("fs");
const { pr_str } = require("./printer");
const { read_str } = require("./reader");
const { List, MalSymbol, Vecotr, Nil, Str, Atom } = require("./types");

const ns = new Map();

ns.set(new MalSymbol("+"), (n1, n2) => n1 + n2);
ns.set(new MalSymbol("-"), (n1, n2) => n1 - n2);
ns.set(new MalSymbol("*"), (n1, n2) => n1 * n2);
ns.set(new MalSymbol("/"), (n1, n2) => n1 / n2);

ns.set(new MalSymbol("prn"), (arg) => {
  if (arg === undefined) {
    return Nil;
  }
  console.log(pr_str(arg, true));
  return Nil;
});

ns.set(new MalSymbol("list"), (...args) => new List(args));
ns.set(new MalSymbol("list?"), (arg) => arg instanceof List);
ns.set(new MalSymbol("empty?"), (seq) => seq.isEmpty());

ns.set(new MalSymbol("count"), (seq) => {
  if (!(seq instanceof List || seq instanceof Vecotr)) {
    return 0;
  }
  return seq.ast.length;
});

ns.set(new MalSymbol("="), (a, b) => a === b);
ns.set(new MalSymbol("<"), (a, b) => a < b);
ns.set(new MalSymbol("<="), (a, b) => a <= b);
ns.set(new MalSymbol(">"), (a, b) => a > b);
ns.set(new MalSymbol(">="), (a, b) => a >= b);

ns.set(new MalSymbol("slurp"), (filename) => {
  try {
    const content = fs.readFileSync(filename.string, "utf-8");
    return new Str(content);
  } catch (e) {
    throw "File reading faliled";
  }
});

ns.set(new MalSymbol("read-string"), (str) => read_str(str.string));

ns.set(new MalSymbol("pr-str"), (...args) => {
  return new Str(
    args
      .map((arg) => {
        const string = pr_str(arg, true);
        if (string.startsWith('"')) {
          return string.slice(1, -1);
        }
        return string;
      })
      .join(" ")
  );
});

ns.set(new MalSymbol("str"), (...args) => {
  return new Str(
    args
      .map((arg) => {
        const string = pr_str(arg, false);
        if (string.startsWith('"')) {
          return string.slice(1, -1);
        }
        return string;
      })
      .join("")
  );
});

ns.set(new MalSymbol("atom"), (malValue) => {
  return new Atom(malValue);
});
ns.set(new MalSymbol("atom?"), (atom) => {
  return atom instanceof Atom;
});
ns.set(new MalSymbol("deref"), (atom) => {
  return atom.malValue;
});
ns.set(new MalSymbol("reset!"), (atom, malValue) => {
  atom.malValue = malValue;
  return atom.malValue;
});

module.exports = { ns };
