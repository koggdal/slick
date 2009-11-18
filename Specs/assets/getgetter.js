// -*- Mode: JavaScript; tab-width: 4; -*-

(function(){
	
	window.scripts_to_get = parent.scripts_to_get || window.location.search.match(/\bscript=(.*?\.js)/gi) || ['http://mootools.github.com/slick/slick.js','bootstrap/slick.slickspec.js'];
	
	for (var i=0, scriptsrc; scriptsrc = scripts_to_get[i]; i++){
		
		scripts_to_get[i] = scriptsrc = decodeURIComponent(scriptsrc.replace(/^(&?script=)+/,''));
		
		scriptsrc.replace(/^(?!=http|\/)/,'../');
		
		if (document.write) document.write('<scr'+'ipt src="'+ scriptsrc +'" type="text/javascript"><\/script>');
		
		else if (document.documentElement.nodeName == 'HTML'){
			var script = document.createElement('script');
			script.setAttribute('src', scriptsrc);
			script.setAttribute('type', 'text/javascript');
			document.documentElement.appendChild(script);
		}
		
		// else evalRemote(scriptsrc);
		
		if (/\bbootstrap\b/.test(scriptsrc)) scripts_to_get.splice(i,1);
		
	}
	
	var framework_name = scripts_to_get[0].replace(/^.*\//,'');
	
	// function evalRemote(url){
	// 	if (!(/^(\/|http:)/).test(url) && /\bmocks\b/.test(document.location.href)) url = '../' + url;
	// 	
	// 	var code = getResource(url);
	// 	
	// 	try {
	// 		globalEval(code);
	// 	} catch(e){
	// 		try{console.log(e);}catch(e){};
	// 	}
	// };
	// 
	// function getResource(url) {
	// 	if (!(XMLHttpRequest || ActiveXObject)) return false;
	// 	request = (XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
	// 	if (!request) return false;
	// 	request.open("GET", url + '?' + Math.random().toString(32), false);
	// 	// try {
	// 		request.send(null);
	// 	// } catch(e){}
	// 	
	// 	if (request.status != 200) return false;
	// 	return request.responseText;
	// }
	// 
})();