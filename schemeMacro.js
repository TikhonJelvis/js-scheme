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

        for (var part = parts; part != SchemeValues.NIL; part = part.cdr) {
            if (part.matches(expr)) {
                return part.transform(expr);
            }
        }

        throw "The given expression (" + expr + ") does not match the macro (" + exp + ").";
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
        var template = templatePattern(ruleExp.car.cdr),// Everything but the keyword defining it.
            body = ruleExp.cdr;// The resulting expression.

        /**
         * Returns whether this rule matches the given expression.
         * @param {SchemeExpression} exp the expression to check.
         * @return whether the given expression matches this rule.
         */
        ruleExp.matches = function (exp) {
            return template.matches(exp);
        };

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

    /**
     * Represents a pattern in the template like (or a) or (let ((binding name) ...) body).
     *
     * @param {SchemeExpression} exp the expression defining the pattern.
     * @param {Boolean} vararg whether this pattern should capture a list or just itself.
     * @return {SchemePattern} the pattern corresponding to the expression.
     */
    function templatePattern(exp, vararg) {
        exp = schemeExpression(exp);

        if (exp.list) {
            for (var part = exp; part != SchemeValues.NIl; part = part.cdr) {
                if (part.cdr.car.rest) {
                    part.car = templatePattern(exp, true);
                } else {
                    part.car = templatePattern(exp);
                }
            }
        }

        /**
         * Returns whether this pattern matches the given expression.
         *
         * @param {SchemeExpression} expr the expression to check.
         * @return whether the given expression matches this template.
         */
        this.matches = function (expr) {
            if (exp.atom && !vararg) {
                return expr.cdr = SchemeValues.NIL;
            } else if (exp.atom) {
                return true;
            } else if (!vararg) {
                return match(exp, expr);
            } else {
                var matches = true;

                for (var e = expr; e != SchemeValues.NIL; e = e.cdr) {
                    matches = match(exp, e) && matches;
                }

                return matches;
            }

            /**
             * Returns whether the given part of the template matches the given part of the expression.
             *
             * @param {SchemeTemplate} part the part of the template to check.
             * @param {SchemeExpression} e the part of the expression to check.
             * @return whether the part of the template matches the part of the expression.
             */
            function match(part, e) {
                var matches = true;
                
                for (var tmp = exp; tmp != SchemeValues.NIl; part = part.cdr, tmp = tmp.cdr) {
                    if (tmp.cdr != SchemeValues.NIL && tmp.cdr.car.rest) {
                        matches = tmp.car.matches(part.cdr) && matches;
                        break;
                    } else {
                        matches = tmp.car.matches(part.car) && matches;
                    }
                }

                return matches;                
            }
        };

        /**
         * Binds the given expression to the names in this pattern in the given environment.
         * This assumes that the given expression can be validly bound to the template. 
         *
         * @param {SchemeExpression} expr the expression to bind.
         * @param {SchemeEnvironment} the environment in which to bind it.
         */
        this.bind = function (expr, env) {
            if (vararg) {
                this.bindRest(expr, env);
            }
            
            if (exp.atom) {
                env.bind(exp, expr);
            } else {
                for (var part = exp; part != SchemeValues.NIL; part = part.cdr, expr = expr.cdr) {
                    part.car.bind(expr.car);
                }
            }
        };

        /**
         * Given an expression that is a list of expressions matching this pattern, binds the
         * expression to the pattern recursively. This is used when a pattern is followed by
         * an ellipsis (...).
         *
         * @param {SchemeExpression} expr the expression to bind.
         * @param {SchemeEnvironment} the environment in which to bind it.
         */
        this.bindRest = function (expr, env) {
            if (exp.atom) {
                env.bind(exp, expr);
            } else {
                for (var part = exp, i = 0; part != SchemeValues.NIL; part = part.cdr, i++) {
                    for (var bindPart = expr; bindPart != SchemeValues.NIl; bindPart = bindPart.cdr) {
                        part.car.bind(getPart(bindPart, i));
                    }
                }
            }

            /**
             * Gets the part of an expression at the given index.
             *
             * @param {SchemeExpression} exp a scheme expression that is a list.
             * @param {int} index the index to get from the list.
             * @return the part of the given expression at the given index.
             */
            function getPart(exp, index) {
                for (var i = 0, part = exp; i < index; i++, part = part.cdr);
                return part.car;
            }
        };
    }

    /**
     * Returns a string representation of the macro.
     *
     * @return a string representation of the macro.
     */
    exp.toString = function () {
        return "{" + exp + "}";
    };

    return exp;
}