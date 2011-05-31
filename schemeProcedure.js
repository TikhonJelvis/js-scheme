/**
 * Turns the given Scheme expression in the given environment into a Scheme procedure.
 *
 * @function
 * @param {SchemeExpression} exp the expression which makes up this procedure. This expression
 *  has to be a list.
 * @param {SchemeEnvironment} [env=GLOBAL_ENVIRONMENT] the environment in which this procedure was created.
 */
function schemeProcedure(exp, env) {
    if (!exp.list) {
        console.log(exp);
        throw "The expression defining a procedure has to be a list!";
    }
    
    exp.env = env;

    exp.parameterNames = exp.car,
    exp.body = exp.cdr;

    if (!exp.parameterNames.list) {
        exp._vararg = true;
    }

    /**
     * Binds the given parameters to this procedure's parameter names in the specified
     * environment. If there are too many values passed in, only the first n values are bound
     * where n is the number of named parameters of this procedure. If not enough parameters
     * are passed in, the remaining names are not bound at all. Additionally, and extra
     * variable called _params is bound referencing the list of paramter values.
     *
     * @function
     * @memberOf SchemeProcedure
     * @param {SchemeEnvironment} env the environment in which to bind the variables.
     * @param {SchemeExpression} parameters a Scheme list of parameters.
     */  
    exp.bindParameters = function (env, parameters) {
        var names = exp.parameterNames;
        
        env.bind(schemeExpression("_params"), parameters);
        if (!exp._vararg) {
            while (parameters != SchemeValues.NIL && names != SchemeValues.NIL) {
                env.bind(names.car, parameters.car);
                parameters = parameters.cdr;
                names = names.cdr;
            }
        } else {
            env.bind(names, parameters);
        }
    };

    var oldToString = exp.toString;
    exp.toString = function (noParens) {
        return "[" + Characters.LAMBDA + " " + exp.parameterNames + " " +
            exp.body.toString(true) + "]";
    };

    return exp;
}

