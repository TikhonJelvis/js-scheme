/**
 * Returns the given SchemeExpression as a macro in the given environment. This
 * corresponds to (syntax-rules <exp>).
 *
 * @param {SchemeExpression} exp the expression defining the macro.
 * @param {SchemeEnvironment} env the environment in which to make the macro.
 * @return {SchemeMacro} the resulting macro.
 */
function schemeSyntaxRules(exp, env) {
    exp = schemeExpression(exp);
    env = env || GLOBAL_ENVIRONMENT;
    if (!exp.list) {
        throw "The expression defining a macro has to be a list!";
    }
    exp.macro = true;
    exp.env = env;

    // Parts of the syntax-rules:
    exp.literals = exp.car;
    var parts = exp.cdr;
    while (parts != SchemeValue.NIL) {
        parts.car = schemeSyntaxRule(parts.car);
        parts = parts.cdr;
    }

    /**
     * Given an expression, returns that expression (unevaluated) after having this rule applied
     * to it. This assumes the expression has been stripped of its keyword. If the number of
     * sub-expressions of the expression is not compatible with this rule, an exception will be
     * thrown.
     *
     * @param {SchemeExpression} expr the expression to transform without its keyword.
     * @return {SchemeExpression} the resulting transformed expression (not evaluated).
     */
    exp.transform = function (expr) {
        expr = schemeExpression(expr);
        for (var len = 0, e = expr; e != SchemeValues.NIL; e = e.cdr);
        for (var p = parts; parts != SchemeValues.NIL; p = p.cdr) {
            if (len == p.car.length || (len > p.car.length && p.car._vararg)) {
                return p.car.transform(expr);
            }
        }
        throw "Wrong number of arguments passed to macro!";
    };

    /**
     * Returns the given SchemeExpression as a SchemeSyntaxRule which is part of a SchemeMacro.
     * This strips out the keyword of the rule (the first element of the list defining it).
     *
     * @param {SchemeExpression} ruleExp the expression defining the rule.
     * @return {SchemeSyntaxRule} the resulting syntax rule.
     */
    function schemeSyntaxRule(ruleExp) {
        ruleExp = schemeExpression(ruleExp);
        var template = ruleExp.car.cdr,// Everything but the keyword defining it.
            body = ruleExp.cdr;// The resulting expression.

        ruleExp.length = 0;
        for (var tmp = template; tmp != SchemeValue.NIL; tmp = tmp.cdr) {
            if (tmp.car.rest) {
                ruleExp._vararg = true;
                ruleExp.length--;
            } else {
                ruleExp.length++;
            }
        }

        /**
         * Given a SchemeExpression, transforms it according to its rule. The SchemeExpression passed in
         * should match the pattern.
         *
         * @param {SchemeExpression} exp the expression to transform. This assumes that the keyword has
         *  been stripped out of the expression.
         * @return {SchemeExpression} the result of applying this rule on the given expression.
         */
        ruleExp.transform = function (exp) {
            var newEnv = new SchemeEnvironment(env),
                values = exp,
                result = schemeExpression(body);

            for (var names = template; names != SchemeValues.NIL; names = names.cdr) {
                if (names.cdr != SchemeValues.NIL && !names.cdr.car.rest) {
                    newEnv.bind(names.car, values.car);
                } else {
                    newEnv.bind(names.car, values.cdr);
                    break;
                }
                
                values = value.cdr;
            }

            for (var curr = result; curr != SchemeValues.NIL; curr = curr.cdr) {
                if (newEnv.lookup(curr.car)) {
                    curr.car = newEnv.looup(curr.car);
                }
            }

            return result;
        };
    }
}