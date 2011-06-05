;; This is the library of Scheme code that supplements the code defined by JavaScript.
(define list (lambda args args))
(define (map fn ls)
  (if (null? ls)
      nil
      (cons (fn (car ls)) (map fn (cdr ls)))))
(define (accumulate fn base ls)
  (if (null? ls) 
      base
      (accumulate fn (fn base (car ls)) (cdr ls))))
(define (filter fn ls)
  (if (null? ls)
      ls
      (if (fn (car ls))
          (cons (car ls) (filter fn (cdr ls)))
          (filter fn (cdr ls)))))
(define (even? num) (= (% num 2) 0))
(define (_wrap-2-arg fn base)
  (lambda args
    (accumulate fn base args)))
(define + (_wrap-2-arg + 0))
(define * (_wrap-2-arg * 1))
(define = (lambda args
            (null? (filter (lambda (n) (not (js= n (car args)))) (cdr args)))))
(define (zero? z) (= z 0))
(define (positive? x) (> x 0))
(define (negative? x) (< x 0))
(define (odd? n) (= (% n 2) 1))
(define (even? n) (= (% n 2) 0))
(define (not b) (if b #f #t))
(define and (lambda args 
	      (if (null? args) #t 
		  (if (null? (cdr args)) (car args)
		      (if (car args) (apply and (cdr args)) #f)))))
(define or (lambda args
	     (if (null? args) #f
		 (if (null? (cdr args)) (car args)
		     (if (car args) (car args) (apply or (cdr args)))))))
(define print (lambda args (apply jsfunc (cons `function ()
					       {cli.output(Array.prototype.join.call(arguments, ","),
										    "info")}` args))))
(define (range start end) (if (> start end) nil (cons start (range (+ start 1) end))))