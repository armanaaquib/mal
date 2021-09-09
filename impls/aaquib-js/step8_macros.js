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

const quasiquote = (ast) => {
  if (ast instanceof List && ast.beginsWith("unquote")) {
    return ast.ast[1];
  }

  if (ast instanceof List) {
    let result = new List([]);
    for (let i = ast.ast.length - 1; i >= 0; i--) {
      const el = ast.ast[i];

      if (el instanceof List && el.beginsWith("splice-unquote")) {
        result = new List([new MalSymbol("concat"), el.ast[1], result]);
      } else {
        result = new List([new MalSymbol("cons"), quasiquote(el), result]);
      }
    }
    return result;
  }

  if (ast instanceof MalSymbol || ast instanceof Hashmap) {
    return new List([new MalSymbol("quote"), ast]);
  }

  if (ast instanceof Vecotr) {
    return new List([new MalSymbol("vec"), quasiquote(new List(ast.ast))]);
  }

  return ast;
};

const isMacroCall = (ast, env) => {
  return (
    ast instanceof List &&
    ast.ast[0] instanceof MalSymbol &&
    env.find(ast.ast[0]) &&
    env.get(ast.ast[0]) instanceof Fn &&
    env.get(ast.ast[0]).isMacro
  );
};

const macroExpand = (ast, env) => {
  while (isMacroCall(ast, env)) {
    const macro = env.get(ast.ast[0]);
    ast = macro.apply(ast.ast.slice(1));
  }
  return ast;
};

const READ = (str) => read_str(str);

const EVAL = (ast, env) => {
  while (true) {
    ast = macroExpand(ast, env);

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

      case "quote": {
        return ast.ast[1];
      }

      case "quasiquoteexpand": {
        return quasiquote(ast.ast[1]);
      }

      case "quasiquote": {
        ast = quasiquote(ast.ast[1]);
        break;
      }

      case "defmacro!": {
        if (ast.ast.length !== 3) {
          throw "Wrong no of inputs to defmacro!";
        }

        const val = EVAL(ast.ast[2], env);
        val.isMacro = true;
        return env.set(ast.ast[1], val);
      }

      case "macroexpand": {
        return macroExpand(ast.ast[1], env);
      }

      case "fn*": {
        const fn = (...args) => {
          const newEnv = Env.createEnv(env, ast.ast[1].ast, args);
          return EVAL(ast.ast[2], newEnv);
        };
        return new Fn(ast.ast[2], ast.ast[1].ast, env, fn);
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
rep(
  "(def! map (fn* [mapper li] (reduce (fn* [cx el] (concat cx (list (mapper el)))) '() li)))"
);
rep(
  "(def! filter (fn* [pred li] (reduce (fn* [cx el] (if (pred el) (concat cx (list el)) cx)) '() li)))"
);
rep(
  "(def! some? (fn* [pred li] (if (> (count (filter pred li)) 0) true nil)))"
);
rep("(def! every? (fn* [pred li] (= (count li) (count (filter pred li)))))");
rep(
  "(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw \"odd number of forms to cond\")) (cons 'cond (rest (rest xs)))))))"
);
rep("(defmacro! defn! (fn* [name args body] `(def! ~name (fn* ~args ~body))))");

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
