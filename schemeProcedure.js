/**
 * Returns the given Scheme expression in the given environment as a Scheme procedure.
 *
 * @function
 * @param {SchemeExpression} exp the expression which makes up this procedure. This expression
 *  has to be a list.
 * @param {SchemeEnvironment} [env=GLOBAL_ENVIRONMENT] the environment in which this procedure was created.
 * @return the resulting procedure.
 */
function schemeProcedure(exp, env) {
    exp = schemeExpression(exp);
    env = env || GLOBAL_ENVIRONMENT;

    if (!exp.list) {
        console.log(exp);
        throw "The expression defining a procedure has to be a list!";
    }

    exp.proc = true;

    exp.env = env;

    exp.parameterNames = exp.car,
    exp.body = exp.cdr;

    if (!exp.parameterNames.cdr) {
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

        bind_args:
        if (!exp._vararg) {
            while (parameters != SchemeValues.NIL && names != SchemeValues.NIL) {
                if (!names.cdr) {
                    console.log(names);
                    env.bind(names, parameters);
                    break bind_args;
                }
                
                env.bind(names.car, parameters.car);
                parameters = parameters.cdr;
                names = names.cdr;
            }

            if (parameters == SchemeValues.NIL && !names.cdr) {
                env.bind(names, SchemeValues.NIL);
                break bind_args;
            }

            if (names != SchemeValues.NIL) {
                schemeError("Too few parameters!\n" + exp);
            } else if (parameters != SchemeValues.NIL) {
                schemeError("Too many parameters!\n" + exp);
            }
        } else {
            env.bind(names, parameters);
        }
    };

    var oldToString = exp.toString;
    exp.toString = function (noParens) {
        return "[" + Characters.LAMBDA + " " + exp.parameterNames + " &rarr; " +
            exp.body.toString(true) + "]\n&rarr;" + exp.env;
    };

    return exp;
}

