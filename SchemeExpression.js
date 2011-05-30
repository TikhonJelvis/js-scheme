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
        value = read(exp);

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