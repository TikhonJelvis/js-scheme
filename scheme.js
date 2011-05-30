// A JavaScript Scheme interpreter! Yay!

/**
 * All the special characters.
 *
 * @constant
 */
var Characters = {
    /**
     * The character used to escape meta-characters in a string.
     */
    ESCAPE : "\\",
    /**
     * The character used to delimit strings.
     */
    STRING_QUOTE : "\"",
    /**
     * The character used to quote expressions.
     */
    QUOTE : "'",
    /**
     * The character used to start lists.
     */
    LIST_START : "(",
    /**
     * The character used to end lists.
     */
    LIST_END : ")",
    /**
     * The quoting character used to denote a string with no escaped values.
     */
    NO_ESCAPE_QUOTE : "`"
};

/**
 * All the special Scheme literals.
 *
 * @const
 */
var SchemeValues = {
    /**
     * The only false value in Scheme land!
     */
    FALSE : "#f"
};

/**
 * The global environment is the only Scheme environment without a parent and is the root of
 * all of the other environments. Everything it contains is in the global scope, accessible
 * everywhere.
 *
 * @constant
 */
var GLOBAL_ENVIRONMENT = new SchemeEnvironment();

/**
 * A convenience function for using Scheme with some sort of console.
 *
 * @param {String} line the line of Scheme to evaluated.
 */
function consoleRepl(line) {
    var exps = readLine(line);

    for (var i = 0; i < exps.length; i++) {
        console.log(schemeEval(exps[i], GLOBAL_ENVIRONMENT).toString());
    }
}

/**
 * Reads in the given line of Scheme, returning an array of strings to print out.
 *
 * @function
 * @param {String} line the line of Scheme code to read and evaluated.
 * @return {String[]} the output of evaluating the Scheme. Error strings are marked with an
 *  ._error property.
 */
function repl(line) {
    var out = [],
        exps = readLine(line);

    for (var i = 0; i < exps.length; i++) {
        try {
            exps[i] = schemeEval(exps[i], GLOBAL_ENVIRONMENT);
            out.push(exps[i].toString());
        } catch (e) {
            e = e.toString();
            e._error = true;
            out.push(e);
        }
    }

    return out;
}

/**
 * Returns the SchemeExpressions that correspond to the given line of text.
 *
 * @param {String} line the line of text to read.
 * @return {SchemeExpression[]} an array of the resulting SchemeExpressions.
 */
function readLine(line) {
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
 * Represents a Scheme expression which can either be an atom or a list.
 *
 * @constructor
 * @param {String} exp the string that represents this expression.
 */
function SchemeExpression(exp) {
    var value;

    if (isQuoted(exp)) {
        exp = Characters.LIST_START + "quote " + unquote(exp) + Characters.LIST_END;
    }

    if (isAtom(exp)) {
        this.atom = true;
        value = this;
        if (isSelfEvaluating(exp)) {
            this.selfEvaluating = true;
        } else {
            this.variable = true;
        }
    } else {
        this.list = true;

        exp = exp.trim().substring(1, exp.length - 1);
        value = readLine(exp);

        if (isSpecialForm(value[0].toString())) {
            this.specialForm = true;
        }
    }

    /**
     * Returns the value of this SchemeExpression. The value is an internal representation of
     * the expression.
     *
     * @return {SchemeExpression|SchemeExpression[]} the value of this
     *  SchemeExpression.
     */
    this.getValue = function () {
        return value;
    };

    /**
     * Returns the specified element from this expression as long as this is a list.
     *
     * @function
     * @memberOf SchemeExpression
     * @param {Integer} [pos=0] the position of the element to get.
     * @return {SchemeExpression} the expression at the given position.
     */
    this.get = function (pos) {
        if (!(value instanceof Array)) {
            throw "You can only get an element from a list!";
        }
        pos = pos || 0;
        return value[pos];
    };

    /**
     * Returns the elements from this expression starting with pos1 up to (but not including) pos2.
     *
     * @function
     * @memberOf SchemeExpression
     * @param {Integer} pos1 the position to get from.
     * @param {Integer} [pos2=values.length] the position to go up to. This has to be greater than
     *  pos1.
     * @return {SchemeExpression[]} the expressions in the given range.
     */
    this.getRange = function (pos1, pos2) {
        var values = [];
        
        if (!(value instanceof Array)) {
            throw "You can only get an element from a list!";
        }
        
        pos1 = pos1 || 0;
        pos2 = pos2 || value.length;

        for (var i = pos1; i < pos2; i++) {
            values.push(value[i]);
        }

        return values;
    };

    /**
     * Returns a string representation of this expression. If the expression is an atom, just
     * returns the atom's value. Otherwise returns a properly formatted list or quoted expression.
     *
     * @return {String} a string representation of this expression.
     */
    this.toString = function () {
        if (this.atom) {
            return exp;
        } else if (this.list) {
            return Characters.LIST_START + value.join(" ") + Characters.LIST_END;
        } else {
            return "INVALID";
        }
    };
}

/**
 * Represents a Scheme procedure, which is a special type of expression.
 *
 * @constructor
 * @param {SchemeExpression} exp the expression which makes up this procedure. This expression
 *  has to be a list.
 */
function SchemeProcedure(exp) {
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
    var newEnv = new SchemeEnvironment(env);

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
 * All of the special forms currently availible.
 *
 * @see specialForm
 */
var specialForms = {
    /**
     * The special form for creating procedures.
     *
     * @param {SchemeExpression} exp an expression that should be a list starting with lambda
     *  and containing a list of argument names as well as a body.
     * @return {SchemeProcedure} the Scheme procedure this lambda expression creates.
     */
    lambda : function (exp) {
        return new SchemeProcedure(exp);
    },
    /**
     * The special form for simple conditionals.
     *
     * @param {SchemeExpression} exp the is expression. This should be a list of length 4
     *  beginning with "if" and containg a predicate and two bodies.
     * @param {SchemeEnvironment} env the environment in which to evaluated the if statement.
     * @return {SchemeExpression} the result of evaluating the appropriate statement.
     */
    if : function (exp, env) {
        var value = exp.getValue();
        
        if (schemeEval(value[1], env).toString().trim() != SchemeValues.FALSE) {// If true:
            return schemeEval(value[2], env);
        } else { // If false:
            return schemeEval(value[3], env);
        }
    },
    /**
     * The special form for defining variables. This can do two things: bind variables and bind
     * procedures using a shorthand notation.
     *
     * @param {SchemeExpression} exp the define expression.
     * @param {SchemeEnvironment} env the environment in which to evaluate this expression. This
     *  is the environment in which the appropriate variable will be bound and also the
     *  environment in which the new value is evaluated.
     * @return {SchemeExpression} the expression which was just bound to a name.
     */
    define : function (exp, env) {
        var value = exp.getValue();

        if (value[1].list) {// We're defining a procedure:
            var procName = value[1].get(0),
                paramNames = listExpression(value[1].getRange(1)),
                body = exp.getRange(2),
                lambda = listExpression(["lambda", paramNames].concat(body));
            console.log(value[1]);
            console.log(lambda);

            return schemeEval(listExpression(["define", procName].concat(lambda)), env);
        } else {
            var name = value[1].getValue(),
                newValue = value[2];

            env.bind(name, schemeEval(newValue, env), env);
            return newValue;
        }
    },
    /**
     * Returns the value of the expression without evalling it.
     *
     * @param {SchemeExpression} exp the quoted expression. Must be in the form (quote exp).
     */
    quote : function (exp, env) {
        return exp.getValue()[1];
    },
    /**
     * Calls a given js function with the given parameters. For example, to alert "hello world", do this:
     * (jsfunc 'alert "hello world").
     *
     * @param {SchemeExpression} exp the jsfunc expression to evaluate.
     * @param {SchemeEnvironment} env the environment in which to evaluated the js function.
     * @return {SchemeExpression} returns the result of evaluating what the js function returned.
     */
    jsfunc : function (exp, env) {
        var value = exp.getValue(),
            jsFuncName = schemeEval(value[1], env).toString(),
            jsArgs = exp.getRange(2);

        if (isString(jsFuncName)) {
            jsFuncName = stringValue(jsFuncName);
        }

        for (var i = 0; i < jsArgs.length; i++) {
            jsArgs[i] = schemeEval(jsArgs[i], env).toString();
        }

        jsArgs = jsArgs.join(", ");

        return new SchemeExpression(eval("(" + jsFuncName + ")" + "(" + jsArgs + ");") + "");
    }
};

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
 * @param {String} expression the Scheme expression to check.
 * @return {Boolean} whether the given expression is quoted.
 */
function isQuoted(expression) {
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
    return exp.trim()[0] == Characters.QUOTE;
}

/**
 * Returns whether the given expression is a scheme string.
 *
 * @param {String} exp the expression to check.
 * @return {Boolean} whether the given expression is a scheme string.
 */
function isString(exp) {
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