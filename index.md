---
title: Scheme
author: Tikhon Jelvis
---

<div class="content">

# Scheme in JavaScript

A while back, I wrote a little Scheme interpreter in JavaScript. It only supports very basic Scheme constructs like lambdas and numbers. I did not add macros or continuations. This also means some features you'd normally expect, like `let`, are missing because I was planning to implement `let` as a macro but never finished the macro system!

I also wrote a very basic REPL for it. You can play around a bit.

Try something basic like

    (define (fib n)
      (if (or (= n 0) (= n 1))
        n
        (+ (fib (- n 1)) (fib (- n 2))))).

</div>

<div class="content">

## Try It!

Here is a simple JavaScript REPL for my Scheme interpreter. Type in the very top row. Try something simple like `(+ 1 2)`.

<div class="schemePrompt code" id="schemePrompt">
</div>
</div>

<div class="content">

## Embedding

I also added some cute JavaScript-specific features into the language. You can embed JavaScript code inside your Scheme code using backticks:

    (cons `function () { return 10 }` 11)
    
You can also embed Scheme code directly into your page using `<script>` tags:

    <script language="scheme">
      (define (avg ls) (/ (accumulate + 0 ls) (length ls)))
    </script>
    
Now the `avg` function is available to other Scheme code you have on your page. Unfortunately, this does *not* work with scripts from a different file. So `<script language="scheme" src="foo.scm">` won't work.

</div>