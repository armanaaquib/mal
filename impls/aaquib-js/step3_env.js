const readline = require("readline");
const { read_str } = require("./reader");
const { pr_str } = require("./printer");
const { MalSymbol, List, Vecotr, Hashmap } = require("./types");
const Env = require("./env");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const env = new Env();

env.set(new MalSymbol("+"), (n1, n2) => n1 + n2);
env.set(new MalSymbol("-"), (n1, n2) => n1 - n2);
env.set(new MalSymbol("*"), (n1, n2) => n1 * n2);
env.set(new MalSymbol("/"), (n1, n2) => n1 / n2);
env.set(new MalSymbol("pi"), Math.PI);
env.set(new MalSymbol("empty?"), (seq) => seq.isEmpty());

const eval_ast = (ast, env) => {
  if (ast instanceof MalSymbol) {
    const val = env.get(ast);

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

      return EVAL(ast.ast[2], newEnv);
    }

    default: {
      const [fn, ...args] = eval_ast(ast, env).ast;
      if (fn instanceof Function) {
        return fn.apply(null, args);
      }

      throw `${fn} is not a function`;
    }
  }
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
