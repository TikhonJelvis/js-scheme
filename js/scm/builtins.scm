(define (cons a b) (lambda (car?) (if car? a b)))
(define (car pair) (pair '#t))
(define (cdr pair) (pair '#f))