/**
 * Represents a Scheme procedure, which is a special type of expression.
 *
 * @constructor
 * @param {SchemeExpression} exp the expression which makes up this procedure. This expression
 *  has to be a list.
 * @param {SchemeEnvironment} [env=GLOBAL_ENVIRONMENT] the environment in which this procedure was created.
 */
function SchemeProcedure(exp, env) {
    if (!exp.list) {
        console.log(exp);
        throw "The expression defining a procedure has to be a list!";
    }
    
    var value = exp.getValue(),
        parameterNames = value[1].getValue(),
        body = [];

    for (var i = 2; i < value.length; i++) {
        body.push(value[i]);
    }

    /**
     * Returns the body of the procedure. The body is the code that is run when the procedure is
     * invoked.
     *
     * @return {SchemeExpression[]} an array of SchemeExpressions to run.
     */
    this.getBody = function () {
        return body;
    };

    /**
     * Returns the environment in which this procedure was created.
     *
     * @function
     * @memberOf SchemeProcedure
     * @return {SchemeEnvironment} the environment in which this procedure was created.
     */
    this.getEnv = function () {
        return env;
    };

    /**
     * Binds the given parameters to this procedure's parameter names in the specified
     * environment. If there are too many values passed in, only the first n values are bound
     * where n is the number of named parameters of this procedure. If not enough parameters
     * are passed in, the remaining names are not bound at all.
     *
     * @param {SchemeEnvironment} env the environment in which to bind the variables.
     * @param {SchemeExpression[]} parameters the values to bind to parameter names.
     */  
    this.bindParameters = function (env, parameters) {
        for (var i = 0; i < parameters.length && i < parameterNames.length; i++) {
            env.bind(parameterNames[i], parameters[i]);
        }
    };

    /**
     * Returns the value of the expression which this procedure corresponds to.
     *
     * @see SchemeExpression#getValue
     * @return {SchemeExpression[]} the value of the expression used to create this procedure.
     */
    this.getValue = function () {
        return exp.getValue();
    };

    /**
     * Returns a string representation of this procedure.
     *
     * @return {String} the string representation of this procedure.
     */
    this.toString = function () {
        return exp.toString();
    };
}

