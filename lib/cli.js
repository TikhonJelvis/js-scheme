// A command-line interface emulator.

/**
 * Creates a new command-line interface.
 *
 * @constructor
 * @requires jQuery
 * @param {Function} runner the function called on all the inputs. This function is passed both
 *  the inputs and a reference to the originating Cli.
 */
function Cli(runner) {
    var that = this;
    
    // HTML elements:
    var top = $("<div>"),
        output = $("<div>"),
        input = $("<input>");

    // Command history:
    var history = [],
        currentCommand = 0,
        commandsShifted = false;

    // The prompt that marks your input in the history:
    var prompt = ">";

    /**
     * Input the given text to the command line. This is what happens when
     * somebody enters some text. This pushes the text to the command history.
     *
     * @function
     * @memberOf Cli
     * @param {String} text the text to enter.
     */
    this.input = function (text) {
        history.push(text);
        runner(text, that);
    };

    /**
     * Sends the text currently in the input to the command line. This also
     *
     * @function
     * @memberOf Cli
     */
    this.send = function send() {
        var value = that.getInput();
        that.output(prompt + value, "in");
        that.input(value);

        if (commandsShifted) {
            history.shift();
            commandsShifted = false;
        }
        
        history.unshift(value);
        currentCommand = -1;
        that.setInput("");
    };

    /**
     * Outputs the given text to the command line.
     *
     * @function
     * @memberOf Cli
     * @param {String} text the text to output. If this is falsey, nothing will happen.
     * @param {String} [type] the type of output this is. This corresponds to a
     *  css class that determines how the line will be displayed.
     */
    this.output = function (text, type) {
        if (text) {
            text = text.toString();
            
            var line = $("<div>");
            
            if (type) {
                line.addClass(type);
            }
            line.addClass("line");
            
            line.append(text.replace(/\n/gm, "<br />"));
            output.prepend(line);
        }
    };

    /**
     * Returns the current value of the input text box.
     *
     * @function
     * @memberOf Cli
     * @return {String} the text currently entered into the input text box.
     */
    this.getInput = function () {
        return input.val();
    };

    /**
     * Sets the text displayed in the input text box without sending a command.
     *
     * @function
     * @memberOf Cli
     * @param {String} text the text for the input text box to display.
     */
    this.setInput = function (text) {
        input.val(text);
    };

    /**
     * Returns the html element that contains the cli interface.
     *
     * @function
     * @memberOf Cli
     * @return {jQuery} the jQuery-extended div that contains everything.
     */
    this.getElement = function () {
        return top;
    };

    /**
     * Tries to move the command history back one and returns the resulting
     * command. If the history is empty, returns null and does not change
     * anything.
     *
     * @function
     * @return {null|String} the previous command in the history or null if the
     *  history is empty.
     */
    function previousCommand() {
        if (history.length > 0) {
            if (currentCommand === -1) {
                currentCommand = 1;
                history.unshift(that.getInput());
            } else if (currentCommand >= history.length) {
                currentCommand = 0;
            }
            
            currentCommand++;

            commandsShifted = true;
            return(history[currentCommand]);
        } else {
            return null;
        }
    }

    /**
     * Tries to move the command history forward one and returns the resulting
     * command. If the history is empty, returns null and changes nothing.
     *
     * @function
     * @return {null|String} the resulting command or null if there is no
     *  history.
     */
    function nextCommand() {
        if (currentCommand > 1) {
            currentCommand--;
            return history[currentCommand - 1];
        } else {
            return null;
        }
    }

    $("body").keydown(function (event) {
        switch (event.keyCode) {
        case 13 :// Enter
            that.send();
            break;
        case 38 :// Up
            input.val(previousCommand());
            break;
        case 40 :// Down
            input.val(nextCommand());
            break;
        default :
            // Do nothing!
            break;
        }

        return;
    });

    top.append(input);
    top.append(output);
};
