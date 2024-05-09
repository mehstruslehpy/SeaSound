(ql:quickload "hunchentoot")

;; A sample dispatcher
(defun hello ()
  (format t "This text is printed on the backend.")
  (terpri)
  (format nil "This text is returned to the browser."))

;; A dispatcher showing how to access and print data 
;; received in a POST request from the browser
(defun pianoroll ()
  (format t "Data received from browser:")
  (terpri)
  (format t (hunchentoot:raw-post-data :force-text t))
  (terpri)
  (format nil "This text is returned to the browser."))

;; Push the two dispatcher functions to hunchentoots dispatch table
(push
  (hunchentoot:create-prefix-dispatcher "/hello" #'hello)
  hunchentoot:*dispatch-table*)
(push
  (hunchentoot:create-prefix-dispatcher "/pianoroll" #'pianoroll)
  hunchentoot:*dispatch-table*)

;; Set up and run hunchentoot
(defvar *server* (make-instance 'hunchentoot:easy-acceptor :document-root "./" :port 4242))
(hunchentoot:start *server*)

