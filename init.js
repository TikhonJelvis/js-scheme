/**
 * Sets up the cli console for the example.
 */
$(function () {
    // Create the cli interface (we _want_ it in the global scope!)
    cli = new Cli(function (text, cli) {
        var result = repl(text);
        for (var i = 0; i < result.length; i++) {
            if (result[i].type) {
                cli.output(result[i].out, result[i].type);
            } else {
                cli.output(result[i].out);
            }
        }
    });
    $("#schemePrompt").append(cli.getElement());

    // Load all the Scheme code in the page:
    var data = "",
        schemeTags = $('script[language~="scheme"]');

    for (var i = 0; i < schemeTags.length; i++) {
        data += schemeTags.html();
    }

    load(data);
});
