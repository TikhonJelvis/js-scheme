/**
 * All of the special forms currently availible.
 *
 * @see Scheme#specialForm
 */
var specialForms = {
    /**
     * The special form for creating procedures.
     *
     * @param {SchemeExpression} exp an expression that should be a list starting with lambda
     *  and containing a list of argument names as well as a body.
     * @return {SchemeProcedure} the Scheme procedure this lambda expression creates.
     */
    lambda : function (exp, env) {
        return schemeProcedure(exp, env);
    },
    /**
     * The special form for simple conditionals.
     *
     * @param {SchemeExpression} exp the is expression. This should be a list of length 4
     *  beginning with "if" and containg a predicate and two bodies.
     * @param {SchemeEnvironment} env the environment in which to evaluated the if statement.
     * @return {SchemeExpression} the result of evaluating the appropriate statement.
     */
    if : function (exp, env) {
        if (schemeEval(exp.car, env).toString().trim() != SchemeValues.FALSE) {// If true:
            return schemeEval(exp.cdr.car, env);
        } else { // If false:
            if (!exp.cdr.cdr.nil) {
                return schemeEval(exp.cdr.cdr.car, env);
            } else {
                return SchemeValues.NIL;
            }
        }
    },
    /**
     * The special form for defining variables. This can do two things: bind variables and bind
     * procedures using a shorthand notation.
     *
     * @param {SchemeExpression} exp the define expression.
     * @param {SchemeEnvironment} env the environment in which to evaluate this expression. This
     *  is the environment in which the appropriate variable will be bound and also the
     *  environment in which the new value is evaluated.
     * @return {SchemeExpression} the expression which was just bound to a name.
     */
    define : function (exp, env) {
        if (exp.car.list) {// We're defining a procedure:
            var procName = exp.car.car,
                paramNames = exp.car.cdr,
                body = exp.cdr,
                lambda = list([schemeExpression("lambda"), paramNames]);
            lambda.cdr.cdr = body;

            return specialForms.define(list([procName, lambda]), env);
        } else {
            var name = exp.car,
                newValue = schemeEval(exp.cdr.car, env);

            env.bind(name, newValue);
            return newValue;
        }
    },
    "define-syntax" : function (exp, env) {
        console.log("Defining syntax!");
        var name = exp.car,
            macro = schemeSyntaxRules(exp.cdr.car.cdr);

        console.log("Name: " + name);
        console.log("Macro: " + macro);

        env.bind(name, macro);
        return macro;
    },
    "set!" : function (exp, env) {
        var name = exp.car,
            value = schemeEval(exp.cdr.car, env);

        env.set(name, value);
        return value;
    },
    /**
     * Returns the value of the expression without evalling it.
     *
     * @param {SchemeExpression} exp the quoted expression. Must be in the form (quote exp).
     */
    quote : function (exp, env) {
        return exp.car;
    },
    /**
     * Returns a string with the given expression as its value.
     *
     * @param {SchemeExpression} exp the expression to stringify.
     * @param {SchemeEnvironment} env the environment in which to evaluate this expression.
     * @return {SchemeExpression} the Scheme expression that is the given expression as a string.
     */
    "str-quote" : function (exp, env) {
        return schemeExpression('"' + schemeEval(exp.car, env) + '"');
    },
    /**
     * Calls a given js function with the given parameters. For example, to alert "hello world", do this:
     * (jsfunc 'alert "hello world").
     *
     * @param {SchemeExpression} exp the jsfunc expression to evaluate.
     * @param {SchemeEnvironment} env the environment in which to evaluated the js function.
     * @return {SchemeExpression} returns the result of evaluating what the js function returned.
     */
    jsfunc : function (exp, env) {
        var jsFuncName = schemeEval(exp.car, env).toString(),
            jsArgs = exp.cdr,
            jsArgsArray = [];

        if (isString(jsFuncName)) {
            jsFuncName = stringValue(jsFuncName);
        }

        while (!jsArgs.nil) {
            jsArgsArray.push(schemeEval(jsArgs.car, env));
            jsArgs = jsArgs.cdr;
        }

        for (var i = 0; i < jsArgsArray.length; i++) {
            jsArgsArray[i] = jsArgsArray[i].toString();
        }

        jsArgsArray = jsArgsArray.join(", ");

        var jsResult = eval("(" + jsFuncName + ")" + "(" + jsArgsArray + ");");
        
        if (typeof jsResult == "undefined") {
            return SchemeValues.NIL;
        } else if (typeof jsResult == "boolean") {
            return wrapBool(jsResult);
        }
        
        return schemeExpression(jsResult);
    },
    cons : function (exp, env) {
        return pair(schemeEval(exp.car, env), schemeEval(exp.cdr.car, env));
    },
    car : function (exp, env) {
        return schemeEval(exp.car, env).car;
    },
    cdr : function (exp, env) {
        return schemeEval(exp.car, env).cdr;
    },
    "null?" : function (exp, env) {
        return wrapBool(schemeEval(exp.car, env).nil);
    },
    apply : function (exp, env) {
        var proc = schemeEval(exp.car, env);
        return schemeApply(proc, schemeEval(exp.cdr.car, env), env);
    }
};

/**
 * Given a value turns into #t if it is truthy and #f if it is falsy by JavaSCript standards.
 *
 * @param bool the value to translate.
 * @returns {SchemeExpression} #t if the value is truthy and #f otherwise.
 */
function wrapBool(bool) {
    return bool ? SchemeValues.TRUE : SchemeValues.FALSE;
}

for (var form in specialForms) {
    with ({form : form}) {
        var formExpression = schemeExpression(form);
        formExpression.specialForm = true;
        formExpression.name = form;
        formExpression.toString = function () {
            return "[spec=" + form + "]";
        };
        GLOBAL_ENVIRONMENT.bind(schemeExpression(form), formExpression);
    }
}