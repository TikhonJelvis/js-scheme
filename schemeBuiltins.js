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
    "=" : function (a, b) { return a == b;},
    ">" : function (a, b) { return a > b;},
    "<" : function (a, b) { return a < b;},
    ">=" : function (a, b) { return a >= b;},
    "<=" : function (a, b) { return a <= b;}
};

for (var proc in builtins) {
    builtins[proc] = wrap(builtins[proc]);
}

/**
 * Wraps the given JavaScript function in a Scheme lambda.
 *
 * @param {Function} jsfunc the JavaScript function to wrap.
 * @return {SchemeProcedure} the Scheme procedure wrapping the JavaScript function.
 */
function wrap(jsfunc) {
    var numArgs = jsfunc.length,
        args = ""; 

    for (var i = 0; i < numArgs; i++) {
        args += "a" + i + " ";
    }
    args = args.trim();

    var expression = Characters.LIST_START + Characters.LIST_START +
        args + Characters.LIST_END + " " + Characters.LIST_START + "jsfunc" + " " +
        Characters.NO_ESCAPE_QUOTE + jsfunc + Characters.NO_ESCAPE_QUOTE + " " + args +
        Characters.LIST_END + Characters.LIST_END;

    return schemeProcedure(schemeExpression(expression), GLOBAL_ENVIRONMENT);
}

/**
 * Adds all of the built-in procedures to the given Scheme environment.
 *
 * @param {SchemeEnvironment} env the environment to which to add the procedures.
 */
function augment(env) {
    for (var proc in builtins) {
        env.bind(proc, builtins[proc]);
    }
}

augment(GLOBAL_ENVIRONMENT);