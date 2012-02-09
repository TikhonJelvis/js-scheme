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
    NO_ESCAPE_QUOTE : "`",
    /**
     * A pretty lambda symbol for the web.
     */
    LAMBDA : "&#955;",
    /**
     * The character that separates the two elements of a pair which isn't a list.
     */
    PAIR_SEPARATOR : ".",
    /**
     * The character that denotes the rest of the line as a comment.
     */
    COMMENT : ";"
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
    FALSE : "#f",
    /**
     * This is just for convenience--everything but #f is actually true.
     */
    TRUE : "#t",
    /**
     * The empty list is really special, so here it is:
     */
    NIL : {
        list : true,
        nil : true,
        toString : function (noParens) {
            return noParens ? "" : "()";
        }
    }
};

