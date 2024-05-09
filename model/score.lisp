;;;; This file defines a score.
;;;; a score object contain lists of audo block structures that contain musical score data.
;;; TODO: We need to define all score methods here.
(defclass score ()
	(blocklist :accessor get-blocks :initarg ()))
