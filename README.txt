srccolor
========

srccolor is an extension to display colored source code files. Instead of
displaying it in black and white (for css and javascript) or offering to
download them (for other languages, such a as python, java, vbscript etc),
firefox will then display the source code with syntax coloration.

It's a bootstraped addon which mean you don't need to restart Firefox after
installing it.

srccolor uses amazing [highlight.js library][1].


* which languages are supported ?  
bash, cpp, css, diff, erlang, haskell, java, javascript, lisp, lua, perl,
python, ruby, scala, sql, tex, vala and vbscript.

* I've got a file in a supported languages, but Firefox still asks me to
 download it.  
Filetype detection is based on mime type sent by the server. If the server
sends an incorrect mime type, it will not be displayed in srccolor. Also, it
may be a valid mime type, which srccolor does not known about. In doubt, do not
hesitate to send me an email with a link to suspicious file.

* How do I personalize color scheme for srccolor ?  
You can create the file chrome/srccolor.css in your [profile folder][2], and
change css rules that will apply to colored content. See also explanation on
[highlight.js site][3]

* I've got other questions or comments  
mail me at: arno@renevier.net

[1]: http://softwaremaniacs.org/soft/highlight/en/
[2]: http://kb.mozillazine.org/Profile_folder
[3]: http://softwaremaniacs.org/wiki/doku.php/highlight.js:style
