// A JavaScript Scheme interpreter! Yay!
/**
 * The global environment is the only Scheme environment without a parent and is the root of
 * all of the other environments. Everything it contains is in the global scope, accessible
 * everywhere.
 *
 * @constant
 */
var GLOBAL_ENVIRONMENT = new SchemeEnvironment();
GLOBAL_ENVIRONMENT.bind(schemeExpression("nil"), SchemeValues.NIL);

/**
 * Evaluates the given Scheme expression. If no expression is given, nothing happens.
 *
 * @param {SchemeExpression} exp a Scheme expression to evaluate.
 * @param {SchemeEnvironment} env the Scheme environment in which to evaluate the expression.
 * @return {SchemeExpression} the result of evaluating the given expression.
 */
function schemeEval(exp, env) {
    try {
        return exp.quoted ? exp.value :
            exp.selfEvaluating ? exp :
            exp.variable ? env.lookup(exp) || schemeError("Variable " + exp + " does not exist!") :
            exp.list ? schemeApply(schemeEval(exp.car, env), exp.cdr, env) :
            schemeError("Invalid expression!\n" + exp);
    } catch (e) {
        if (e.schemeError) {
            e.stack.push(exp);
        }

        throw e;
    }
}

/**
 * Applies the given expression (which has to be a function invokation) in the given environment.
 *
 * @param {SchemeProcedure} proc the Scheme procedure to invoke
 * @param {SchemeExpression} params a Scheme list of parameters to pass to the procedure.
 * @param {SchemeEnvironment} [env=GLOBAL_ENVIRONMENT] the environment in which to apply the
 *  function.
 * @return {SchemeExpression} the result of calling the given procedure with the given arguments in the
 *   given environment.
 */
function schemeApply(proc, params, env) {
    env = env || GLOBAL_ENVIRONMENT;

    if (proc.specialForm) {
        return specialForms[proc.name](params, env);
    } else if (proc.macro) {
        return schemeEval(proc.transform(params), env);
    } else if (proc.proc) {
        var newEnv = new SchemeEnvironment(proc.env),
            evalledParams = [];

        while (params != SchemeValues.NIL) {
            evalledParams.push(schemeEval(params.car, env));
            params = params.cdr;
        }

        evalledParams = list(evalledParams);
        proc.bindParameters(newEnv, evalledParams);
        
        return schemeEvalSequence(proc.body, newEnv);
    } else {
        throw "Bad function:\n" + proc;
    }
}

/**
 * Evals a Scheme list as a sequence of expressions.
 *
 * @param {SchemeExpression} seq the sequence of expressions to eval.
 * @param {SchemeEnvironment} env the environment in which to eval the expressions.
 * @return {SchemeExpression} the result of evaluating the last expression in the sequence.
 */
function schemeEvalSequence(seq, env) {
    var result;
    while (seq != SchemeValues.NIL) {
        result = schemeEval(seq.car, env);
        seq = seq.cdr;
    }

    return result;
}

/**
 * Fires off a Scheme error alerting the programmer to a problem.
 *
 * @param {String} text the error message to show.
 */
function schemeError(text) {
    throw {
        text : "Scheme Error:\n" + text,
        stack : [],
        schemeError : true,
        toString : function () {
            return this.text + ((this.stack.length > 0) ? "\n" +
                "at:\n" + this.stack.join("\n") : "");
        }
    };
}

/**
 * Evaluates the given expression as a special form.
 *
 * @param {SchemeExpression} exp the expression to evaluate.
 * @param {SchemeEnvironment} env the environment in which to evaluate it.
 * @return {SchemeExpression} the result of evaluting the given expression as a special form.
 */
function specialForm(exp, env) {
    var value = exp.value,
        form = value[0];// The particular form to execute...

    try {
        return specialForms[form](exp, env);
    } catch (e) {
        schemeError("The special form " + form + " did not work!\n" + "Message: " + e);
    }
}