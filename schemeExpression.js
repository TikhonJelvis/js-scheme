/**
 * Given a string returns the corresponding SchemeExpression. If it is passed a
 * SchemeExpression instead of a string, returns a copy of that SchemeExpression.
 *
 * @constructor SchemeExpression
 * @param {String} exp the string to turn into an expression.
 * @return {SchemeExpression} the scheme expression that represents the given string.
 */
function schemeExpression (exp) {
    if (exp._scheme) {
        var obj = {};
        for (var prop in exp) {
            if (exp[prop]._scheme) {
                obj[prop] = schemeExpression(exp[prop]);
            } else {
                obj[prop] = exp[prop];
            }
        }

        return obj;
    } 

    if (isQuoted(exp)) {
        return quoted(exp);
    } else if (isAtom(exp)) {
        return atom(exp);
    } else if (isPairLiteral(exp)) {
        exp = exp.trim();
        exp = exp.substring(1, exp.length - 1);
        var first = nextToken(exp),
            last = nextToken(remainder(remainder(exp)));
        return pair(schemeExpression(first), schemeExpression(last));
    } else if (isList(exp)) {
        var spec = isSpecialForm(exp),
            toReturn;
        exp = exp.trim().substring(1, exp.length - 1);

        toReturn = list(read(exp));

        if (spec) {
            toReturn.specialForm = true;
        }

        return toReturn;
    } else {
        throw "Invalid exprssion: " + exp;
    }

    /**
     * Returns the Scheme expression which corresponds to the given quoted string.
     *
     * @function
     * @param {String} exp the quoted expression.
     * @return {SchemeExpression} the resulting expression.
     */
    function quoted(exp) {
        return {
            _scheme : true,
            car : schemeExpression("quote"),
            cdr : pair(schemeExpression(unquote(exp)), SchemeValues.NIL),
            list : true,
            toString : function () {
                return Characters.QUOTE + this.cdr.car;
            }
        };
    }

    /**
     * Returns the expression corresponding to the given atom string.
     *
     * @function
     * @param {String} exp the expression string.
     * @return {SchemeExpression} the resulting expression.
     */
    function atom(exp) {
        var toReturn = {
            _scheme : true,
            value : exp,
            atom : true,
            toString : function () {
                return exp;
            }
        };

        if (isVariable(exp)) {
            toReturn.variable = true;
        } else {
            toReturn .selfEvaluating = true;
        }
        
        return toReturn;
    }

    /**
     * Returns the value of the quoted expression. If the given expression is not actually quoted,
     * the return value is not defined.
     *
     * @param {String} exp a quoted expression as a String.
     * @return {String} the actual value of the quoted expression.
     */
    function unquote(exp) {
        return exp.replace(/^.*?'/,"");
    }

    // Type predicates:
    /**
     * Returns whether the given expression string is a quoted expression.
     *
     * @param {String} exp the Scheme expression to check.
     * @return {Boolean} whether the given expression is quoted.
     */
    function isQuoted(exp) {
        return exp.toString()[0] == Characters.QUOTE;
    }

    /**
     * Returns whether the given expression is self-evaluating. The only self-evaluating
     * expressions are strings and numbers.
     *
     * @param {String} exp the expression to check.
     * @return {Boolean} whether the given expression is self-evaluating.
     */
    function isSelfEvaluating(exp) {
        exp += "";
        if (/^[-+]?\d*\.?\d+$/.test(exp) || exp == "" || exp == "#f" || exp == "#t") {
            return true;
        }

        var isString = (exp[0] == Characters.STRING_QUOTE) &&
            indexOfUnescaped(exp.substring(1), Characters.STRING_QUOTE) > -1;
        var isNoEscapeString = (exp[0] == Characters.NO_ESCAPE_QUOTE) &&
            exp.substring(1).indexOf(Characters.NO_ESCAPE_QUOTE) > -1;
        
        return isString || isNoEscapeString;
    }

    /**
     * Returns whether the given expression is a variable name. A variable name is any atom that
     * is not self-evaluating.
     *
     * @param {String} exp the Scheme expression to check.
     * @return {Boolean} whether the given expression is a variable name.
     */
    function isVariable(exp) {
        return isAtom(exp) && !isSelfEvaluating(exp);
    }

    /**
     * Returns whether the given expression is an atom. An atom is a self-evaluating expression
     * or a variable name--any valid expression that is not a list is an atom. If the passed in
     * expression is not valid, the behavior is not defined--it could return either true or false.
     *
     * @param {String} exp the valid Scheme expression to check.
     * @return {Boolean} whether the given expression is an atom.
     */
    function isAtom(exp) {
        return !isList(exp);
    }

    /**
     * Returns whether the given expression is a list. A list is anything that is not an atom.
     *
     * @param {String} exp the expression to check.
     * @return {Boolean} whether the given expression is a list.
     */
    function isList(exp) {
        exp += "";
        return exp.trim()[0] == Characters.LIST_START &&
            exp.trim()[exp.length - 1] == Characters.LIST_END;
    }

    /**
     * Returns whether the given string represents a pair literal. A pair literal is anything in the
     * form (expression . expression).
     *
     * @function
     * @param {String} exp the string to check.
     * @return {Boolean} whether the given string is a pair literal.
     */
    function isPairLiteral(exp) {
        var pairLiteral = true;
        exp = (exp + "").trim();
        if (exp[0] != Characters.LIST_START || exp[exp.length - 1] != Characters.LIST_END) {
            pairLiteral = false;
        } else {
            exp = exp.substring(1, exp.length - 1);
        }

        var secondToken = nextToken(remainder(exp));
        if (secondToken.trim() != Characters.PAIR_SEPARATOR) {
            pairLiteral = false;
        }

        if (pairLiteral) console.log("It's a pair!");
        return pairLiteral;
    }

    /**
     * Returns whether the given expression is a special form. Special forms are more complicated
     * than function calls and have to be handled specially (hence the name).
     *
     * @param {String} exp the expression to check.
     * @return {Boolean} whether the given expression is a special form.
     */
    function isSpecialForm(exp) {
        return exp in specialForms;
    }
}

/**
 * Given a list of strings returns a list of corresponding Scheme expressions.
 *
 * @function
 * @param {String[]} list the string to turn into expressions.
 * @return {SchemeExpression[]} the resulting expressions.x
 */
function expressionList (list) {
    var exps = [];

    for (var i = 0; i < list.length; i++) {
        exps[i] = schemeExpression(list[i]);
    }

    return exps;
}

// Creating scheme expressions:
/**
 * Returns a Scheme pair containing the two given Scheme expressions.
 *
 * @function
 * @param {SchemeExpression} car the first element of the pair.
 * @param {SchemeExpression} cdr the second element of the pair.
 * @return {SchemeExpression} the actual pair.
 */
function pair(car, cdr) {
    var toReturn = {
        _scheme : true,
        car : car,
        cdr : cdr,
        pair : true,
        toString : function (noParens) {
            var inside = car;

            if (cdr.pair) {
                inside += " " + cdr.toString(true);
            } else if (!cdr.nil) {
                inside += " " + Characters.PAIR_SEPARATOR + " " + cdr;
            }

            return noParens ? inside : Characters.LIST_START + inside + Characters.LIST_END; 
        }
    };

    if (cdr.list) {
        toReturn.list = true;
    }
    
    return toReturn;
}

/**
 * Returns a Scheme list containing the given expressions.
 *
 * @function
 * @param {SchemeExpression[]} parts the expressions the list will contain.
 * @return {SchemeExpression} the resulting list.
 */
function list(parts) {
    var toReturn,
        end = parts.end;

    // It's not an improper list:
    if (end) {
        delete parts.end;
        var ls = list(parts);
        delete ls.list;
        for (var lsp = ls; lsp.cdr != SchemeValues.NIL; lsp = lsp.cdr);
        lsp.cdr = end;
        return ls;
    }

    if (parts.length == 0) {
        return SchemeValues.NIL;
    } else if (parts.length == 1) {
        toReturn =  pair(parts[0], SchemeValues.NIL);
    } else {
        toReturn = pair(parts[0], list(parts.slice(1)));
    }

    if (!parts.end) {
        toReturn.list = true;
    } 

    toReturn._scheme = true;

    toReturn.toString = function (noParens) {
        var inside = toReturn.cdr.nil || toReturn.cdr.cdr ?
            toReturn.car + " " + toReturn.cdr.toString(true) :
            toReturn.car + " . " + toReturn.cdr.toString();
            
        inside = inside.trim();
        
        if (noParens) {
            return inside;
        } else {
            return Characters.LIST_START + inside + Characters.LIST_END;
        }
    };

    return toReturn;
}

/**
 * Returns the actual string value of a Scheme string.
 *
 * @param {SchemeExpression} exp the Scheme expression which is a string.
 * @return {String} an actual string that is the same as the Scheme string.
 */
function stringValue(exp) {
    return exp.toString().trim().substring(1, exp.length - 1);
}