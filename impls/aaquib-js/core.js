const { pr_str } = require("./printer");
const { List, MalSymbol, Vecotr, Nil } = require("./types");

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

// ns.set(new MalSymbol("pr-str"), (...args) => {
//   return args.map((arg) => pr_str(arg, true)).join(" ");
// });
// ns.set(new MalSymbol("str"), (...args) => {
//   return args.map((arg) => pr_str(arg, false)).join("");
// });

module.exports = { ns };
