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
        return new SchemeProcedure(exp, env);
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
        var value = exp.getValue();
        
        if (schemeEval(value[1], env).toString().trim() != SchemeValues.FALSE) {// If true:
            return schemeEval(value[2], env);
        } else { // If false:
            return schemeEval(value[3], env);
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
        var value = exp.getValue();

        if (value[1].list) {// We're defining a procedure:
            var procName = value[1].get(0),
                paramNames = listExpression(value[1].getRange(1)),
                body = exp.getRange(2),
                lambda = listExpression(["lambda", paramNames].concat(body));

            return schemeEval(listExpression(["define", procName].concat(lambda)), env);
        } else {
            var name = value[1].getValue(),
                newValue = schemeEval(value[2], env);

            env.bind(name, newValue);
            return newValue;
        }
    },
    "set!" : function (exp, env) {
        var name = exp.get(1),
            value = schemeEval(exp.get(2), env);

        env.set(name, value);
        return value;
    },
    /**
     * Returns the value of the expression without evalling it.
     *
     * @param {SchemeExpression} exp the quoted expression. Must be in the form (quote exp).
     */
    quote : function (exp, env) {
        return exp.getValue()[1];
    },
    /**
     * Returns a string with the given expression as its value.
     *
     * @param {SchemeExpression} exp the expression to stringify.
     * @param {SchemeEnvironment} env the environment in which to evaluate this expression.
     * @return {SchemeExpression} the Scheme expression that is the given expression as a string.
     */
    "str-quote" : function (exp, env) {
        return new SchemeExpression('"' + schemeEval(exp.get(1), env).toString() + '"');
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
        var value = exp.getValue(),
            jsFuncName = schemeEval(value[1], env).toString(),
            jsArgs = exp.getRange(2);

        if (isString(jsFuncName)) {
            jsFuncName = stringValue(jsFuncName);
        }

        for (var i = 0; i < jsArgs.length; i++) {
            jsArgs[i] = schemeEval(jsArgs[i], env);
            
            if (jsArgs[i].list) {
                jsArgs[i] = jsArgs[i].getValue().join(", ");
            } else {
                jsArgs[i] = jsArgs[i].toString();
            }
        }

        jsArgs = jsArgs.join(", ");

        var jsResult = eval("(" + jsFuncName + ")" + "(" + jsArgs + ");");
        return new SchemeExpression(jsResult);
    },
    /**
     * Returns a Scheme procedure which lets you call methods on the given JavaScript object.
     *
     * @function
     * @param {SchemeExpression} exp the expression calling the special form.
     * @param {SchemeEnvironment} env the environment in which to evaluate the form.
     * @return {SchemeProcedure} a procedure for calling methods on the JavaScript object.
     */
    jsobj : function (exp, env) {
        var name = schemeEval(exp.get(1), env).toString(),
            body = listExpression(["jsfunc", "`function (method, args) {return " + name + "[method](args);}`",
                                   "method", "args"]),
            lambda = listExpression(["lambda", listExpression(["method", "args"]),
                                     new SchemeExpression("(set! method (str-quote method))"), body]);

        return new SchemeProcedure(lambda);
    }
};