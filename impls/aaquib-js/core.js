const fs = require("fs");
const { pr_str } = require("./printer");
const { read_str } = require("./reader");
const {
  List,
  MalSymbol,
  Vecotr,
  Nil,
  Str,
  Atom,
  Fn,
  MalException,
  Keyword,
  Hashmap,
} = require("./types");

const ns = new Map();

ns.set(new MalSymbol("+"), (...args) => args.reduce((n1, n2) => n1 + n2));
ns.set(new MalSymbol("-"), (...args) => args.reduce((n1, n2) => n1 - n2));
ns.set(new MalSymbol("*"), (...args) => args.reduce((n1, n2) => n1 * n2));
ns.set(new MalSymbol("/"), (...args) => args.reduce((n1, n2) => n1 / n2));
ns.set(new MalSymbol("mod"), (...args) => args.reduce((n1, n2) => n1 % n2));

ns.set(new MalSymbol("prn"), (...args) => {
  const str = args.map((arg) => pr_str(arg, true)).join(" ");
  console.log(str);
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
  return new Str(args.map((arg) => pr_str(arg, true)).join(" "));
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
ns.set(new MalSymbol("cons"), (el, list) => {
  return list.cons(el);
});
ns.set(new MalSymbol("concat"), (...lists) => {
  return lists.reduce(
    (concatedLists, list) => concatedLists.concat(list),
    new List([])
  );
});
ns.set(new MalSymbol("vec"), (list) => {
  if (list instanceof List || list instanceof Vecotr) {
    return new Vecotr(list.ast);
  } else {
    throw "Unsupported type";
  }
});
ns.set(new MalSymbol("nth"), (seq, index) => {
  if ((seq instanceof List || seq instanceof Vecotr) && seq.ast[index]) {
    return seq.ast[index];
  } else {
    throw "Unsupported type or out of range index";
  }
});
ns.set(new MalSymbol("first"), (seq) => {
  if (seq === Nil) {
    return Nil;
  }

  if (seq instanceof List || seq instanceof Vecotr) {
    return seq.ast[0] === undefined ? Nil : seq.ast[0];
  } else {
    throw "Unsupported type";
  }
});
ns.set(new MalSymbol("rest"), (seq) => {
  if (seq === Nil) {
    return new List([]);
  }

  if (seq instanceof List || seq instanceof Vecotr) {
    return new List(seq.ast.slice(1));
  } else {
    throw "Unsupported type";
  }
});

ns.set(new MalSymbol("reduce"), (fn, initVAl, seq) => {
  let reducer = fn;
  if (fn instanceof Fn) {
    reducer = fn.fn;
  }

  return seq ? seq.ast.reduce(reducer, initVAl) : initVAl.ast.reduce(reducer);
});

ns.set(new MalSymbol("even?"), (num) => num % 2 === 0);
ns.set(new MalSymbol("odd?"), (num) => num % 2 === 1);
ns.set(new MalSymbol("throw"), (msg) => {
  throw new MalException(msg);
});
ns.set(new MalSymbol("apply"), (fn, ...args) => {
  let appliedArgs = args;
  const lastArg = args[args.length - 1];
  if (lastArg instanceof List || lastArg instanceof Vecotr) {
    appliedArgs = args.slice(0, -1).concat(args[args.length - 1].ast);
  }
  return fn.apply(null, appliedArgs);
});
ns.set(new MalSymbol("nil?"), (val) => val === Nil);
ns.set(new MalSymbol("true?"), (val) => val === true);
ns.set(new MalSymbol("false?"), (val) => val === false);
ns.set(new MalSymbol("symbol"), (str) => new MalSymbol(str.string));
ns.set(new MalSymbol("keyword"), (str) => {
  if (str instanceof Keyword) {
    return str;
  }
  return new Keyword(str.string);
});
ns.set(new MalSymbol("keyword?"), (val) => val instanceof Keyword);
ns.set(new MalSymbol("vector"), (...args) => new Vecotr(args));
ns.set(new MalSymbol("vector?"), (val) => val instanceof Vecotr);
ns.set(
  new MalSymbol("sequential?"),
  (val) => val instanceof Vecotr || val instanceof List
);
ns.set(new MalSymbol("hash-map"), (...args) => {
  if (args.length % 2 === 1) {
    throw "Expected even no of args";
  }
  const map = new Map();
  for (let i = 0; i < args.length - 1; i += 2) {
    map.set(args[i], args[i + 1]);
  }
  return new Hashmap(map);
});
ns.set(new MalSymbol("map?"), (val) => val instanceof Hashmap);
ns.set(
  new MalSymbol("keys"),
  (map) => new List(Array.from(map.hashmap.keys()))
);
ns.set(
  new MalSymbol("vals"),
  (map) => new List(Array.from(map.hashmap.values()))
);
// ns.set(new MalSymbol("get"), (map, key) => {
//   if (map === Nil) {
//     return Nil;
//   }
//   const val = map.hashmap.get(key);
//   return val === undefined ? Nil : val;
// });
// ns.set(new MalSymbol("contains?"), (map, key) => {
//   return map.hashmap.has(key);
// });

module.exports = { ns };
