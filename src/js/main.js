var initShell = function() {
    jQuery(function($, undefined) {
        var width = $(window).innerWidth() - 100,
            height = $(window).innerHeight() - 100;
        $('#cursor').hide();
        $('#term').terminal(function(command, term) {
            if (command !== '') {
                var result = window.eval(command);
                if (result != undefined) {
                    term.echo(String(result));
                }
            }
        }, {
            greetings: '&nbsp;',
            name: 'js_demo',
            height: height,
            width: width,
            prompt: '> '
        });
    });
};

setTimeout(initShell, 6000) // same duration as animated typing
