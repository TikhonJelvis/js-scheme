var blarg = false;

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
        exps;
//    try {
        exps = read(line);

        for (var i = 0; i < exps.length; i++) {
//            try {
                exps[i] = schemeEval(exps[i], GLOBAL_ENVIRONMENT);
                out.push({out : exps[i].toString()});
/*            } catch (e) {
                out.push({
                    out : e.toString(),
                    type : "err"
                });
            }*/
        }
/*    } catch (e) {
        out.push({
            out : e.toString(),
            type : "err"
        });
    }*/

    return out;
}

/**
 * Executes the given code, throwing away all returned values.
 *
 * @function
 * @param {String} code the Scheme code to run.
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

        // This allows us to read the internals of improper lists.
        if (token == Characters.PAIR_SEPARATOR) {
            exps.end = schemeExpression(nextToken(line));
            break;
        } else {
            exps.push(schemeExpression(token));
        }
    }

    return exps;
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
 * Returns the position of the  next token from the given line. If there is no next token
 * in the line, returns [0, 0].
 *
 * @param {String} line the line of text to get the token from.
 * @param {Integer} [startIndex=0] the index from which to get the token.
 * @return The starting and ending index of the token as an array [start, end].
 */
function nextTokenPosition(line, startIndex) {
    line = line.trim();
    
    if (line.length < 1) {
        return [0, 0];
    }
    startIndex = startIndex || 0;
    
    var firstChar = line.substring(0, 1),
        endIndex = 0;

    switch (firstChar) {
    case Characters.COMMENT:
        endIndex = line.indexOf("\n");
        if (endIndex >= 0) {
            var next = nextToken(line.substring(endIndex + 1));
            var start = line.substring(endIndex).indexOf(next);
            return [endIndex + start, endIndex + start + next.length];
        } else {
            return [0, 0];
        }
    case Characters.STRING_QUOTE:
        endIndex = indexOfUnescaped(line.substring(1), Characters.STRING_QUOTE);
        if (endIndex < 0) {
            throw "Syntax error: missing quote:\n" + line;
        }
        return [startIndex, endIndex + 2];
    case Characters.NO_ESCAPE_QUOTE:
        endIndex = line.substring(1).indexOf(Characters.NO_ESCAPE_QUOTE);
        return [startIndex, endIndex + 2];
    case Characters.QUOTE:
        return [startIndex, nextTokenPosition(line.substring(1))[1] + 1];
    case Characters.LIST_START:
        endIndex = matchBalancedPair(line);
        if (endIndex < 0) {
            throw "Syntax error: missing parentheses:\n" + line;
        }
        return [startIndex, endIndex + 1];
    default:
        var commentIndex = line.indexOf(";"),
            whitespaceIndex = -1;
        if (/.*\s.*/.test(line)) {
            whitespaceIndex = line.indexOf(line.match(/\s/)[0]);
        }
        
        if (commentIndex < 0) {
            endIndex = whitespaceIndex < 0 ? line.length : whitespaceIndex;
        } else if (whitespaceIndex < 0) {
            endIndex = commentIndex < 0 ? line.length : commentIndex;
        } else {
            endIndex = whitespaceIndex < commentIndex ? whitespaceIndex : commentIndex;
        }
        
        return [startIndex, endIndex];
    }
}

/**
 * Returns the next token from the given line. If there is no next token in the line,
 * returns "".
 *
 * @param {String} line the line of text to get the token from.
 * @param {Integer} [startIndex=0] the index from which to get the token.
 * @return {String} the next token.
 */
function nextToken(line, startIndex) {
    line = line.trim();
    var tokenPosition = nextTokenPosition(line, startIndex);
    return line.substring(tokenPosition[0], tokenPosition[1]);
}

/**
 * Returns all but the first token of the line.
 *
 * @param {String} line the line of text to get the remainder from.
 * @return {String} the remainder of the line after the first token is taken away.
 */
function remainder(line) {
    var tokenPosition = nextTokenPosition(line);
    if (tokenPosition[0] === tokenPosition[1]) {
        return "";
    }
    return line.substring(tokenPosition[1]);
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