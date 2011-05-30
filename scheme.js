// A JavaScript Scheme interpreter! Yay!
/**
 * The global environment is the only Scheme environment without a parent and is the root of
 * all of the other environments. Everything it contains is in the global scope, accessible
 * everywhere.
 *
 * @constant
 */
var GLOBAL_ENVIRONMENT = new SchemeEnvironment();

/**
 * Reads in the given line of Scheme, returning an array of strings to print out.
 *
 * @function
 * @see Cli#output
 * @param {String} line the line of Scheme code to read and evaluated.
 * @return {String[]} the output of evaluating the Scheme. Addtionally, a type property is added
 *  to the string if the message should be of a special type. These types correspond to the types
 *  expected by Cli#output
 */
function repl(line) {
    var out = [],
        exps = read(line);

    for (var i = 0; i < exps.length; i++) {
        try {
            exps[i] = schemeEval(exps[i], GLOBAL_ENVIRONMENT);
            out.push({out : exps[i].toString()});
        } catch (e) {
            out.push({
                out : e.toString(),
                type : "err"
            });
        }
    }

    return out;
}

/**
 * Executes the given code, throwing away all returned values.
 */
function load(code) {
    var exps = read(code);
    for (var i = 0; i < exps.length; i++) {
        schemeEval(exps[i], GLOBAL_ENVIRONMENT);
    }
}

/**
 * Returns the SchemeExpressions that correspond to the given line of text.
 *
 * @param {String} line the line of text to read.
 * @return {SchemeExpression[]} an array of the resulting SchemeExpressions.
 */
function read(line) {
    var exps = [],
        token;

    line = line.toString();

    while (line.length > 0) {
        line = line.trim();
        token = nextToken(line);
        line = remainder(line);
        exps.push(new SchemeExpression(token));
    }

    return exps;
}

/**
 * Evaluates the given Scheme expression.
 *
 * @param {SchemeExpression} exp a Scheme expression to evaluate.
 * @param {SchemeEnvironment} env the Scheme environment in which to evaluate the expression.
 * @return {SchemeExpression} the result of evaluating the given expression.
 */
function schemeEval(exp, env) {
    return exp.selfEvaluating ? exp :
        exp.variable ? env.lookup(exp) || schemeError("Variable " + exp + " does not exist!") :
        exp.specialForm ? specialForm(exp, env) :
        exp.list ? schemeApply(schemeEval(exp.getValue()[0], env), exp.getRange(1),
                               env) :
        "INVALID";
}

/**
 * Applies the given expression (which has to be a function invokation) in the given environment.
 *
 * @param {SchemeProcedure} proc the Scheme procedure to invoke
 * @param {SchemeExpression[]} params the parameters to pass to the procedure.
 * @param {SchemeEnvironment} [env=GLOBAL_ENVIRONMENT] the environment in which to apply the
 *  function.
 * @return {SchemeExpression} the result of calling the given procedure with the given arguments in the
 *   given environment.
 */
function schemeApply(proc, params, env) {
    var newEnv = new SchemeEnvironment(proc.getEnv());

    for (var i = 0; i < params.length; i++) {
        params[i] = schemeEval(params[i], env);
    }

    proc.bindParameters(newEnv, params);
    
    return schemeEvalSequence(proc.getBody(), newEnv);
}

/**
 * Evals an array of Scheme expressions in order and returns the result of the last one.
 *
 * @param {SchemeExpression[]} seq the sequence of expressions to eval.
 * @param {SchemeEnvironment} env the environment in which to eval the expressions.
 * @return {SchemeExpression} the result of evaluating the last expression in the sequence.
 */
function schemeEvalSequence(seq, env) {
    for (var i = 0, result; i < seq.length; i++) {
        result = schemeEval(seq[i], env);
    }

    return result;
}

/**
 * Fires off a Scheme error alerting the programmer to a problem.
 *
 * @param {String} text the error message to show.
 */
function schemeError(text) {
    throw text;
}

/**
 * Evaluates the given expression as a special form.
 *
 * @param {SchemeExpression} exp the expression to evaluate.
 * @param {SchemeEnvironment} env the environment in which to evaluate it.
 * @return {SchemeExpression} the result of evaluting the given expression as a special form.
 */
function specialForm(exp, env) {
    var value = exp.getValue(),
        form = value[0];// The particular form to execute...

    try {
        return specialForms[form](exp, env);
    } catch (e) {
        schemeError("The special form " + form + " did not work!\n" + "Message: " + e);
        throw e;
    }
}

/**
 * Creates an expression which is a list from the array of given expressions which can be
 * either String or actual SchemeExpressions.
 *
 * @param {(SchemeExpression|String)[]} list the array of expressions to populate the list.
 * @param {SchemeExpression} the resulting list as a Scheme expression.
 */
function listExpression(list) {
    return new SchemeExpression(Characters.LIST_START + list.join(" ") + Characters.LIST_END);
}

// Type predicates:
/**
 * Returns whether the given expression string is a quoted expression.
 *
 * @param {String} exp the Scheme expression to check.
 * @return {Boolean} whether the given expression is quoted.
 */
function isQuoted(exp) {
    exp += "";
    return /^'.*/.test(expression);
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
    if (/^[-+]?\d*\.?\d+$/.test(exp)) {
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
 * Returns whether the given expression is a special form. Special forms are more complicated
 * than function calls and have to be handled specially (hence the name).
 *
 * @param {String} exp the expression to check.
 * @return {Boolean} whether the given expression is a special form.
 */
function isSpecialForm(exp) {
    return exp in specialForms;
}

/**
 * Returns whether the given expression is a quoted expression.
 *
 * @param {String} exp the expression to check.
 * @return {Boolean} whether the given expression is quoted.
 */
function isQuoted(exp) {
    exp += "";
    return exp.trim()[0] == Characters.QUOTE;
}

/**
 * Returns whether the given expression is a scheme string.
 *
 * @param {String} exp the expression to check.
 * @return {Boolean} whether the given expression is a scheme string.
 */
function isString(exp) {
    exp += "";
    return /^["`].*["`]$/m.test(exp.replace(/\s/g, " ").trim());
}

// Utility functions:

/**
 * Returns the first index of the given character that is unescaped. An unescaped
 * character is not preceded by an unescaped Characters.ESCAPE.
 *
 * @param {String} string the string to find the unescaped character in.
 * @param {Character} character the character to search for.
 * @param {Integer} [start=0] the index to start searching from.
 * @return {Integer} the location of the first instance of the given character that is
 *  unescaped or -1 if no such instacne is found.
 */
function indexOfUnescaped(string, character, start) {
    var index = 0;
    
    while (string.indexOf(character, start) > -1) {
        index = string.indexOf(character, start);
        if (index == 0 || string[index - 1] != Characters.ESCAPE ||
            indexOfUnescaped(string.substring(index - 2), Characters.ESCAPE) == 1) {
            return index;
        }
    }

    return -1;
}

/**
 * Returns the next token from the given line. If there is no next token in the line,
 * returns "".
 *
 * @param {String} line the line of text to get the token from.
 * @param {Integer} [startIndex=0] the index from which to get the token.
 * @return {String} the first token in the line or "" if no token exists.
 */
function nextToken(line, startIndex) {
    line = line.trim();
    
    if (line.length < 1) {
        return "";
    }
    startIndex = startIndex || 0;
    
    var firstChar = line.substring(0, 1),
        endIndex = 0;

    switch (firstChar) {
    case Characters.STRING_QUOTE:
        endIndex = indexOfUnescaped(line.substring(1), Characters.STRING_QUOTE);
        if (endIndex < 0) {
            throw "Syntax error!";
        }
        return line.substring(startIndex, endIndex + 2);
    case Characters.NO_ESCAPE_QUOTE:
        endIndex = line.substring(1).indexOf(Characters.NO_ESCAPE_QUOTE);
        return line.substring(startIndex, endIndex + 2);
    case Characters.QUOTE:
        return Characters.QUOTE + nextToken(line.substring(1));
    case Characters.LIST_START:
        endIndex = matchBalancedPair(line);
        if (endIndex < 0) {
            throw "Syntax error!";
        }
        return line.substring(startIndex, endIndex + 1);
    default:
        if (/.*\s.*/.test(line)) {
            endIndex = line.indexOf(line.match(/\s/)[0]);
        } else {
            endIndex = line.length;
        }
        return line.substring(startIndex, endIndex);
    }
}

/**
 * Returns all but the first token of the line.
 *
 * @param {String} line the line of text to get the remainder from.
 * @return {String} the remainder of the line after the first token is taken away.
 */
function remainder(line) {
    var token = nextToken(line);

    if (token.length >= line.length) {
        return "";
    }
    
    return line.substring(token.length);
}

/**
 * Given a pair of characters, one starting and one ending, matches the first starting
 * character with its corresponding ending character and returns the ending character's
 * index keeping track of nested pairs. 
 *
 * @param {String} string the string to find the matching ending character in.
 * @param {Character} [startChar=Characters.LIST_START] the starting character of the
 *  matching pair.
 * @param {Character} [endChar=Characters.LIST_END] the ending character of the matching
 *  pair.
 * @return {Integer} the index of the matching ending character. If the starting character is
 *  not in the string or no balanced ending character is found, returns -1.
 */
function matchBalancedPair(string, startChar, endChar) {
    startChar = startChar || Characters.LIST_START;
    endChar = endChar || Characters.LIST_END;

    var open = 0;
    for (var i = string.indexOf(startChar); i < string.length; i++) {
        if (string[i] == startChar) {
            open++;
        } else if (string[i] == endChar) {
            open--;
        }

        if (open == 0) {
            return i;
        }
    }

    return -1;
}

/**
 * Returns the value of the quoted expression. If the given expression is not actually quoted,
 * the return value is not defined.
 *
 * @param {String} exp a quoted expression as a String.
 * @return {String} the actual value of the quoted expression.
 */
function unquote(exp) {
    // TODO: Support other quoting syntaxes!
    return exp.replace(/^.*?'/,"");
}

/**
 * Returns the actual string value of a Scheme string.
 *
 * @param {String} exp the result of calling toString on a SchemeExpression that is a string.
 * @return {String} an actual string that is the same as the Scheme string.
 */
function stringValue(exp) {
    exp = exp.trim();
    return exp.substring(1, exp.length - 1);
}