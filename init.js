/**
 * Sets up the cli console for the example.
 */
$(function () {
    var cli = new Cli(function (text, cli) {
        var result = repl(text);
        for (var i = 0; i < result.length; i++) {
            if (result._error) {
                cli.output(result, "err");
            } else {
                cli.output(result);
            }
        }
    });
    $("#schemePrompt").append(cli.getElement());
});
