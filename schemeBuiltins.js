// The built in procedures for Scheme.

/**
 * A collection of builtin procedures for Scheme.
 *
 * @constant
 */
var builtins = {
    "+" : function (a, b) { return a + b;},
    "-" : function (a, b) { return a - b;},
    "*" : function (a, b) { return a * b;},
    "/" : function (a, b) { return a / b;},
    "%" : function (a, b) { return a % b;},
    "=" : function (a, b) { return a = b;},
    ">" : function (a, b) { return a > b;},
    "<" : function (a, b) { return a < b;},
    ">=" : function (a, b) { return a >= b;},
    "<=" : function (a, b) { return a <= b;}
};

/**
 * Returns a Scheme procedure that corresponds to the given code.
 *
 * @param {String} code the code for a procedure.
 * @return {SchemeProcedure} the resulting procedure.
 */
function createProc(code) {
    return new SchemeProcedure(new SchemeExpression(code));
}

for (var proc in builtins) {
    builtins[proc] = wrap(builtins[proc], ["a", "b"]);
}

/**
 * Wraps the given JavaScript function in a Scheme lambda.
 *
 * @param {Function} jsfunc the JavaScript function to wrap.
 * @return {SchemeProcedure} the Scheme procedure wrapping the JavaScript function.
 */
function wrap(jsfunc, argNames) {
    var argNameList = listExpression(argNames),
        body = listExpression(["jsfunc", Characters.STRING_QUOTE + jsfunc + Characters.STRING_QUOTE]
                              .concat(argNameList.getValue()));
    return new SchemeProcedure(listExpression(["lambda", argNameList, body]));
}

/**
 * Adds all of the built-in procedures to the given Scheme environment.
 *
 * @param {SchemeEnvironment} env the environment to which to add the procedures.
 */
function augment(env) {
    for (var proc in builtins) {
        env.bind(new SchemeExpression(proc), builtins[proc]);
    }
}

augment(GLOBAL_ENVIRONMENT);