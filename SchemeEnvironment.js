/**
 * Represents an environment, which is a set of variable names and binidngs. An environment
 * also has a parent unless it is the global environment.
 *
 * @constructor
 * @param {SchemeEnvironment} parent the parent environment. This environment will look up
 *  any unknown variables in its parent.
 */
function SchemeEnvironment(parent) {
    var bindings = {};
    
    /**
     * Returns the value corresponding to the given given variable name in this environment.
     *
     * @param {SchemeExpression} name the variable name to look up.
     * @return {SchemeExpression} the expression bound to the given name in this environment.
     *  If the given name does not have a binding, false is returned.
     */
    this.lookup = function (name) {
        if (name in bindings) {
            return bindings[name];
        } else if (parent) {
            return parent.lookup(name);
        } else {
            return false;
        }
    };

    /**
     * Binds the given value to the given name in this environment. If the variable name already
     * has a binding in the parent environment, that binding will be overshadowed but not
     * changed. The name will be coerced to a string but the value will not be changed. If an
     * invalid value (not a SchemeExpression, for example) is passed in, that value will be
     * returned by the appropriate lookup and may cause problems further down the line.
     *
     * @param {SchemeExpression} name the name to bind in this environment.
     * @param {SchemeExpression} value the expression to bind to the given name.
     */
    this.bind = function (name, value) {
        bindings[name] = value;
    };

    /**
     * Sets the binding with the given name to the given value. If the binding exists in the
     * parent environment but not in this one, it will be set in the parent. If the variable
     * does not exist, it will be created.
     *
     * @param {SchemeExpression} name the name of the variable to set.
     * @param {SchemeExpression} value the value to set the variable to.
     */
    this.set = function (name, value) {
        if (name in bindings) {
            bindings[name] = value;
        } else if (parent) {
            parent.set(name, value);
        } else {
            bindings[name] = value;
        }
    };
}

