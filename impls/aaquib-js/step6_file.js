const readline = require("readline");
const { read_str } = require("./reader");
const { pr_str } = require("./printer");
const { MalSymbol, List, Vecotr, Hashmap, Nil, Fn } = require("./types");
const Env = require("./env");
const { ns } = require("./core");
const { exit } = require("process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const env = new Env();

env.set(new MalSymbol("eval"), (ast) => EVAL(ast, env));
env.set(new MalSymbol("swap!"), (atom, fn, ...args) => {
  const ast = new List([fn, atom.malValue, ...args]);
  return (atom.malValue = EVAL(ast, env));
});

for (const [key, value] of ns.entries()) {
  env.set(key, value);
}

const eval_ast = (ast, env) => {
  if (ast instanceof MalSymbol) {
    const val = env.get(ast);

    if (val === undefined) {
      throw "symbol not found";
    }

    return val;
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
  while (true) {
    if (!(ast instanceof List)) {
      return eval_ast(ast, env);
    }

    if (ast.isEmpty()) {
      return ast;
    }

    switch (ast.ast[0].symbol) {
      case "def!": {
        if (ast.ast.length !== 3) {
          throw "Wrong no of inputs to def!";
        }

        return env.set(ast.ast[1], EVAL(ast.ast[2], env));
      }

      case "let*": {
        if (ast.ast.length !== 3) {
          throw "Wrong no of inputs to let*";
        }

        let bindings = ast.ast[1];
        if (!(bindings instanceof List || bindings instanceof Vecotr)) {
          throw "let* first arg should be List or Vecotr";
        }

        bindings = bindings.ast;
        if (bindings.length % 2 !== 0) {
          throw "Odd no of args to let*";
        }

        const newEnv = new Env(env);
        for (let i = 0; i < bindings.length; i += 2) {
          newEnv.set(bindings[i], EVAL(bindings[i + 1], newEnv));
        }

        env = newEnv;
        ast = ast.ast[2];
        break;
      }

      case "do": {
        if (ast.ast.length === 1) {
          return Nil;
        }
        ast.ast.slice(1, -1).forEach((form) => EVAL(form, env));
        ast = ast.ast[ast.ast.length - 1];
        break;
      }

      case "if": {
        const cond = EVAL(ast.ast[1], env);
        if (cond === false || cond === Nil) {
          if (ast.ast[3] === undefined) {
            return Nil;
          }
          ast = ast.ast[3];
        } else {
          ast = ast.ast[2];
        }
        break;
      }

      case "fn*": {
        return new Fn(ast.ast[2], ast.ast[1].ast, env);
      }

      default: {
        const [fn, ...args] = eval_ast(ast, env).ast;
        if (fn instanceof Function) {
          return fn.apply(null, args);
        }

        if (fn instanceof Fn) {
          ast = fn.fnBody;
          env = Env.createEnv(fn.env, fn.params, args);
          break;
        }

        throw `${fn} is not a function`;
      }
    }
  }
};

const PRINT = (val) => pr_str(val, true);

const rep = (str) => PRINT(EVAL(READ(str), env));

rep("(def! not (fn* (a) (if a false true)))");
rep(
  '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\nnil)")))))'
);
// rep("(def! *ARGV* ()");

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

if (process.argv[2]) {
  rep(`(load-file "${process.argv[2]}")`);
  exit(0);
} else {
  main();
}
