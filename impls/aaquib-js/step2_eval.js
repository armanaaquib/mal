const readline = require("readline");
const { read_str } = require("./reader");
const { pr_str } = require("./printer");
const { MalSymbol, List, Vecotr, Hashmap } = require("./types");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const env = {
  "+": (n1, n2) => n1 + n2,
  "-": (n1, n2) => n1 - n2,
  "*": (n1, n2) => n1 * n2,
  "/": (n1, n2) => n1 / n2,
  "empty?": (seq) => seq.isEmpty(),
  pi: Math.PI,
};

const eval_ast = (ast, env) => {
  if (ast instanceof MalSymbol) {
    const val = env[ast.symbol];

    if (val) {
      return val;
    }

    throw "symbol not found";
  }

  if (ast instanceof List) {
    const evaluatedList = ast.ast.map((el) => EVAL(el, env));
    return new List(evaluatedList);
  }

  if (ast instanceof Vecotr) {
    const evaluatedVector = ast.ast.map((el) => EVAL(el, env));
    return new Vecotr(evaluatedVector);
  }

  if (ast instanceof Hashmap) {
    const evaluatedHashmap = new Map();
    for (const [key, value] of ast.hashmap.entries()) {
      evaluatedHashmap.set(key, EVAL(value, env));
    }
    return new Hashmap(evaluatedHashmap);
  }

  return ast;
};

const READ = (str) => read_str(str);
const EVAL = (ast, env) => {
  if (!(ast instanceof List)) {
    return eval_ast(ast, env);
  }

  if (ast.isEmpty()) {
    return ast;
  }

  const [fn, ...args] = eval_ast(ast, env).ast;
  if (fn instanceof Function) {
    return fn.apply(null, args);
  }

  throw `${fn} is not a function`;
};
const PRINT = (val) => pr_str(val, true);

const rep = (str) => PRINT(EVAL(READ(str), env));

const main = () => {
  rl.question("user> ", (str) => {
    try {
      console.log(rep(str));
    } catch (e) {
      console.log(e);
    } finally {
      main();
    }
  });
};

main();
