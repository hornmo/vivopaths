// Konstanten

var SPEED = 500;
var FONTMIN = 15;
var FONTMAX = 21;
var MIDMINWIDTH = 200;
var SIDEMINWIDTH = 350;
var HEADERH = 110;
var SEARCHPH = "Suche";
var MAXSUGGESTIONS = 15;
var TYPES = { 0: "authors", 1: "publications", 2: "keywords", 3: "grants" };
var BORDERS = 2;
var OPACFOCUS = 0.8;
var MAXSIDELABELWIDTH = 200;
var OUTERMARGIN = 50;
var COLORS = ["#796823","#4B4B4B","#27606B","#9A3557"];
var BASEURI = "http://test.osl.tib.eu/vivo-tib/individual/";

// Applikationsfunktionen

function View(svg){
  var S = Snap(svg);
  this.init = function() {
    this.selection = this.getPars();
    this.width = $(window).width();
    this.height = $(window).height();
    this.sections = this.setSections();
    S.attr({
      width: this.width, 
      height: this.height - HEADERH
    });
    $('#search input').attr('placeholder', SEARCHPH);
    this.fontsize = this.interval(this.width * this.height, 800 * 600, 1920 * 1080, FONTMIN, FONTMAX, true);
    this.authors = {};
    this.selected = [];
    this.splash = false;
    this.publications = {};
    this.keywords = {};
    this.order = 'year';
    this.getData();
    this.events();
    this.focus = [ false, ''];
    this.pubSplit = {top: [], mid: [], bottom:[]};
    this.offsets = { top: [0,0], mid: [0,0], bottom: [0,0] };
    this.context = {visible: false, item: '' };
    this.selStatus = ['',false,''];
    return this;
  };
  this.setSections = function(){
    var w = $(window).width();
    var h = $(window).height();
    var s = [];
    if(w/3 >= SIDEMINWIDTH && w >= 1024){
      s[0] = [w/3, h];
      s[1] = [w*2/3, h];
      s[2] = [w, h];
    }else{
      s[0] = [SIDEMINWIDTH, h];
      s[1] = [w, h];
      s[2] = s[0];
    }
    return s;
  }
  this.getData = function(){
    var that = this;
    jQuery.getJSON("data/merged_data.json", function(r,s){
      that.data = r;
      if(that.selection != ''){
	that.updateLabels();
      }
    });
  }
  this.getPars = function(){
    var parString = $.address.value();
    var pars = parString.substr(1);
    pars = pars.split(':');
    var ret = [];
    for(var i = 0; i < pars.length; i++){
	var pair = pars[i].split('_');
	if(pair[0].indexOf('Concept') != -1){
	  pair[0] = '2';
	}else if(pair[0].indexOf('Article') != -1){
	  pair[0] = '1';
	}else if(pair[0].indexOf('Grant') != -1){
	  pair[0] = '2';
	}else if(pair[0].indexOf('Person') != -1){
	  pair[0] = '0';
	}
	if(i < 2){
	  ret.push(pair);
	}
    }
    return ret;
  };
  this.orderPubs = function(){
    var that = this;
    $.each(that.pubSplit, function(section, pubs){
      pubs.sort(function(a, b){
	return b[that.order] - a[that.order];
      })
    })
  }
  this.updateLabels = function(){
    delete this.authors;
    delete this.keywords;
    delete this.pubSplit;
    delete this.publications;
    delete this.selected;
    this.pubSplit = {top: [], mid: [], bottom:[]};
    this.selected = [];
    this.authors = [];
    this.keywords = [];
    this.publications = [];
    var that = this;
    var s = {};
    var sel = [];
    if(that.selection[0][0].length && that.data){
      that.showSplash(false);
      $.each(that.selection, function(k,v){
	  sel.push({
	    type: TYPES[v[0]],
	    value: v[1]
	  })
      });
      for(i=0;i<sel.length;i++){
	var obj = '';
	if(that.data[sel[i].type]){
	  obj = that.data[sel[i].type][sel[i].value];
	}
	if(obj){
	  that[sel[i].type].push(obj);
	  if(obj.type == 1){
	    that.pubSplit.top.push(obj);
	  }
	  that.selected.push( obj.type + '_' + obj.id );
	  $.each(TYPES, function(key, type){
	    if(obj[type]){
	      $.each(obj[type],function(relID, relval){
		var dupe = false;
		if(i === 1){
		  $.each(that[type], function(ik, iv){
		    if(iv && iv.id === relID){
		      dupe = true;
		      if(iv.type === 1){
			for(j=0;j<that.pubSplit.top.length;j++){
			  if(that.pubSplit.top[j].id === iv.id){
			    that.pubSplit.mid.push(iv);
			    that.pubSplit.top.splice(j,1);
			  }
			}
		      }
		    }
		  });
		  if(dupe === false && key == 1){
		    that.pubSplit.bottom.push(that.data[TYPES[key]][relID]);
		  }
		}else if(i === 0 && sel[1]){
		  if(sel[1].value == relID && sel[1].type == type){
		    dupe = true;
		  }else if(key == 1){
		    that.pubSplit.top.push(that.data[TYPES[key]][relID]);
		  }
		}else{
		  if(key == 1){
		    that.pubSplit.top.push(that.data[TYPES[key]][relID]);
		  }
		}
		if(dupe === false){
		  that[type].push(that.data[type][relID]);
		}
	      });
	    }
	  });
	}
      }
      that.orderPubs();
      setTimeout(function(){
	that.drawLabels();
      },200);
    }else{
      S.clear();
      $('.label').remove();
      this.showSplash(true);
    }
  };
  this.showSplash = function(bool){
    var that = this;
    $('#splash').children().remove();
    $('#splashmsg').children().remove();
    if(bool === true){
      $('#splash').append('<div id="splash-border"></div>');
      $('#splash-border').append('<div id="splashmsg"></div>');
      $('#splash-border').append('<div class="close-splash"><i class="fa fa-remove"></i></div>');
      $('#splashmsg').append('<div class="splashmsg-body"><b><i>VIVOPaths</i></b> ist eine Applikation zur Visualisierung von semantischen Verbindungen zwischen Entitäten in einer Instanz des Forschungsdatennetzwerks VIVO.</div>');
      $('#splashmsg').append('<div class="splashmsg-heading">Typen</div>');
      $('#splashmsg').append('<div class="splashmsg-body">Zur Zeit werden vier verschiedene Typen in VIVOPaths dargestellt:</div>');
      $('#splashmsg').append('<div class="splashmsg-body"><div class="author hovered splashlabel"><span class="label-icon"><i class="fa fa-user"></i></span><span>Autoren</span></div><div class="pub hovered splashlabel"><span class="label-icon"><i class="fa fa-file"></i></span><span>Publikationen</span></div><div class="keyword hovered splashlabel"><span class="label-icon"><i class="fa fa-tag"></i></span><span>Schlagwörter</span></div><div class="project hovered splashlabel"><span class="label-icon"><i class="fa fa-briefcase"></i></span><span>Projekte</span></div></div>');
      $('#splashmsg').append('<div class="splashmsg-body">Es können bis zu zwei Entitäten ausgewählt werden, über deren Publikationen Verbindungen zu anderen Entitäten angezeigt werden. Dabei stehen die ausgewählten Entitäten und ihre Veröffentlichungen in der Mitte, die mit diesen Verbundenen links und rechts davon. Ausgewählte Entitäten werden durch weiße Schrift auf dunklem Hintergrund gekennzeichnet. Ist eine Publikation ausgewählt, kann keine zweite Entität dazu ausgewählt werden. Ist lediglich eine Entität ausgewählt, werden die zugehörigen Publikationen unter dem Label aufgelistet.</div>');
      $('#splashmsg').append('<div class="splashmsg-body">Sind zwei Entitäten ausgewählt, so wird die Schnittmenge der Publikationen (also solche, die mit beiden Entitäten verbunden sind) zwischen diesen angezeigt, und die restlichen oberhalb (erste Auswahl) bzw. unterhalb (zweite Auswahl) der jeweiligen verbundenen Entität.</div>');
      $('#splashmsg').append('<div class="splashmsg-heading">Labels</div>');
      $('#splashmsg').append('<div class="splashmsg-body">Wird der Mauszeiger über eins der verbundenen Label bewegt, werden dieses Label, sowie alle mit diesem über Publikationen verbundenen Label und deren Verbindungen hervorgehoben. Ein Linksklick auf den Titel speichert diese Ansicht, bis ein anderes Label ausgewählt wird. Ein ausgewähltes Label hat drei Bereiche:</div>');
      $('#splashmsg').append('<div class="splashmsg-body"><span style="float:left;"><span class="splash-body-title">Das Kontext-Symbol</span></span><div class="author splashlabel"><span class="label-icon"><i class="fa fa-user" style="vertical-align:top;"></i></span></div></div>');
      $('#splashmsg').append('<div class="splashmsg-body">Ein Klick auf dieses Symbol ruft ein Fenster mit zusätzlichen Informationen zu der betroffenen Entität auf. In diesem Fenster gibt es auch die Möglichkeit, über einen Link auf die VIVO-Profilseite dieses Eintrags zu gelangen.</div>');
      $('#splashmsg').append('<div class="splashmsg-body"><span class="splash-body-title">Name / Titel</span></div>');
      $('#splashmsg').append('<div class="splashmsg-body">Ein erneuter Linksklick auf den Namen des Labels wählt diesen als aktive Entität aus. Alle Verbindungen werden neu berechnet, und die Anzeige wird neu aufgebaut.</div>');
      $('#splashmsg').append('<div class="splashmsg-body"><span class="splash-body-title">Hinzufügen</span><span class="compare"><i class="fa fa-plus"></i></span></div>');
      $('#splashmsg').append('<div class="splashmsg-body">Durch die Auswahl dieses Feldes wird der Titel als zweite (untere) Entität ausgewählt. Ist bereits eine zweite Auswahl getroffen, wird diese ersetzt.</div>');
      $('#splashmsg').append('<div class="splashmsg-body"><span class="splash-body-title"><span class="splash-body-title">Entfernen (bei Ausgewählten)</span><span class="label-selected-remove"><i class="fa fa-remove"></i></span></div>');
      $('#splashmsg').append('<div class="splashmsg-body">Ausgewählt Begriffe können durch diese Funktion deselektiert werden.</div>');
      $('#splashmsg').append('<div class="splashmsg-heading">Doppelauswahl</div>');
      $('#splashmsg').append('<div class="splashmsg-body">Neben der einfachen Auswahl einzelner Labels können auch zwei Labels gleichzeitig ausgewählt werden. Hierzu muss die Maus über dem Titel eines Labels gedrückt werden und vor dem Loslassen auf den Titel eines anderen Labels gezogen werden. Als optische Rückmeldung auf diesen Prozess wird eine Linie von dem Startpunkt zur aktuellen Cursorposition gezeichnet. Die Auswahl von Publikationen ist so nicht möglich, da eine Publikation nur einzeln ausgewählt werden kann.</div>');
      $('#splashmsg').append('<div class="splashmsg-heading">Suche</div>');
      $('#splashmsg').append('<div class="splashmsg-body">Die Suche erfolgt über alle im Datenbestand vorhandenen Titel und Namen. Eine Selektion aus der Trefferliste wählt den Term in der Anzeige aus.</div>');
      $('#splashmsg').append('<div class="splashmsg-heading">Eindeutige URL</div>');
      $('#splashmsg').append('<div class="splashmsg-body">Um einen direkten Zugriff auf eine bestimmte Auswahl an Entitäten von außerhalb zu ermöglichen, wird die aktuelle Auswahl stets in der Addresszeile repräsentiert. Das Format ergibt sich wie folgt:</div>');
      $('#splashmsg').append('<div class="splashmsg-body"><i>{vivopaths-url}/#/{Typ1}_{ID1}(:{Typ2}_{ID2})</i></div>');
      $('#splashmsg').append('<div class="splashmsg-body"><span class="splash-body-title"><i>Typ1</i></span> bezeichnet den Typ der ersten Auswahl und kann entweder numerisch (0=Autor, 1=Publikation, 2=Schlagwort/Projekt) oder mit englischen Begriffen, basierend auf dem VIVO-RDF-Schema (Person, Article, Grant, Concept) angegeben werden. Danach folgt ein Unterstrich, auf welchen die ID der Entität folgt. Gibt es einen zweiten ausgewählten Term, wird dieser nach einem Doppelpunkt in der gleichen From angehängt.</div>');
      $('.close-splash').on("mouseup", function(e){
	  e.preventDefault();
	  that.splash = false;
	  that.showSplash(false);
      });
    }
  }
  this.events = function(){
    var that = this;
    var rtime;
    var to = null;
    var timeout = false;
    var delta = 200;
    var index = -1;
//     $(this).attr('placeholder', '');
    $('#search input').keyup(function(event){
      var suggestions = $('.suggested');
      if(event.keyCode == 40 || event.keyCode == 38){
	event.preventDefault();
	if(event.keyCode == 40) {
	  index = (index + 1) % suggestions.length;
	}else if(event.keyCode == 38){
	  index = (index + suggestions.length - 1) % suggestions.length;
	}
	if(suggestions){
	  var str = '#' + suggestions[index].id + '.suggested';
	  $('.suggested.suggested-focus').removeClass('suggested-focus');
	  $(str).addClass('suggested-focus');
	  $(this).val(suggestions[index].textContent);
	}
      }else if(event.keyCode === 13){
	event.preventDefault();
	var sid = $('.suggested-focus').attr('id');
	$('#suggestions').css('opacity', 0);
	$('#search input').val('');
	$('#search input').blur();
	index = -1;
	S.clear();
	$('.label').fadeTo(SPEED, 0);
	setTimeout(function(){
	  $('.suggested').remove();
	  that.idToSelection(sid, 1);
	},SPEED/5);
      }else{
	index = -1;
      }
    });
    $('#search input').blur(function(){
      $(this).attr('placeholder', SEARCHPH);
    });
    $('#search input').keyup(function(e){
      if(e.keyCode !== 40 && e.keyCode !== 38 && e.keyCode !== 13){
	var searchTerm = $(this).val();
	var addDiv = 0;
	$('.suggested').remove();
	$('#suggestions').css('opacity', 0);
	if(searchTerm != ''){
	  that.showSuggestions(searchTerm);
	}
      }
    });
    //$('#suggestions').unbind;
    $('#suggestions').on("mouseup", ".suggested", function(e){
	var sid = $(this).attr('id');
	$('#suggestions').css('opacity', 0);
	$('.suggested').remove();
	$('#search input').val('');
	S.clear();
	$('.label').fadeTo(SPEED, 0);
	setTimeout(function(){
	  that.idToSelection(sid, 1);
	},SPEED);
    });
    $('#help').on("mouseup", ".help-icon", function(e){
      if(that.splash == false){
	that.showSplash(true);
	that.splash = true;
      }else{
	that.splash = false;
	that.showSplash(false);
      }
    });
    $(window).resize(function (e){
      that.sections = that.setSections();
      that.splash = false;
      that.showSplash(false);
      var newh = that.sections[0][1] - HEADERH;
      var neww = $(window).width();
      S.clear();
      $('#canvas').css('height', newh);
      S.attr({
	width: neww, 
	height: newh
      });
      that.fontsize = that.interval(neww * newh, 800 * 600, 1920 * 1080, FONTMIN, FONTMAX, true);
      $('.label').fadeTo(SPEED, 0);
      rtime = new Date();
      if (timeout === false) {
	  timeout = true;
	  setTimeout(resizeend, delta);
      }
      function resizeend() {
	  if (new Date() - rtime < delta) {
	      setTimeout(resizeend, delta);
	  } else {
	      timeout = false;
	      S.clear();
	      that.updateLabels();
	  }               
      }
    });
    $(document).ready(function(){
      $.address.externalChange(function(){ that.selection = that.getPars(); that.updateLabels();});
    })
    $('#labels').on("mouseup", ".label:not(.selected)", function(e){
    });
    $('#labels').on("mouseenter", ".label:not(.selected)", function(e){
      var lid = $(this).attr('id');
      var typeN = lid.substr(0,1);
      var typeC = TYPES[typeN].substr(0,1);
      var id = lid.substr(2);
      var pid = [];
      var filter = '';
      var indirCross = {};
      var indirSame = {};
      var eid = '';
      var directEdges = null;
      var item = that.data[TYPES[typeN]][id];
      if(that.focus[0] && that.focus[1] != lid){
	$('#'+that.focus[1]).removeClass('hovered');
	$('#'+that.focus[1]).children('.compare').remove();
	$('.label').removeClass('connected');
	S.selectAll('path').attr({opacity: 0.2, strokeDasharray: "0"});
	that.focus = [false, ''];
      }
      if(item[TYPES[that.selection[0][0]]][that.selection[0][1]]){
	$('#'+that.selected[0]).addClass('connected');
      }
      if(that.selected.length == 2){
	if(item[TYPES[that.selection[1][0]]][that.selection[1][1]]){
	  $('#'+that.selected[1]).addClass('connected');
	}
      }
      $(this).addClass('hovered');
      if(typeN == 1){
	eid = '[id$=' + typeC + id + ']';
	directEdges = $(eid);
	$.each(directEdges, function(ki, vi){
	  var ceid = vi.id.split('X');
	  var cetype = ceid[0].substr(0,1);
	  if(cetype == 'a'){
	    cetype = '0';
	  }else if(cetype == 'k'){
	    cetype = '2';
	  }
	  var elid = '#' + cetype + '_' + ceid[0].substr(1);
	  $(elid).addClass('connected');
	})
      }
      else if(typeN == 0 || typeN == 2){
	if(that.selection[0][0] != 1 && !that.focus[0]){
	  $(this).append('<span class="compare" title="Compare"><i class="fa fa-plus"></i></span>');
	}
	eid = '[id^=' + typeC + id + 'X]';
	directEdges = $(eid);
	if(typeN == 0){
	  opp = { ch: TYPES[2].substr(0,1), no: 2 };
	}else if(typeN == 2){
	  opp = { ch: TYPES[0].substr(0,1), no: 0 };
	}
	$.each(directEdges, function(k, v){
	  pid = $(this).attr('id').split('X');
	  p = '[id$='+ pid[1] + ']';
	  indirCross = $(p).filter('[id^=' + opp.ch +']');
	  indirSame = $(p).filter('[id^=' + typeC +']');
	  if(that.selection[0][0] != 1){
	    $('#1_' + pid[1].substr(1) + '.label').addClass('connected');
	  }
	  $.each(indirCross, function(ki, vi){
	    var conid = "[id=" + vi.id + "]";
	    var ceid = vi.id.split('X');
	    var elid = '#' + opp.no + '_' + ceid[0].substr(1);
	    S.select(conid).attr({opacity: OPACFOCUS});
	    $(elid).addClass('connected');
	  });
	  $.each(indirSame, function(ki, vi){
	    var j = pid.join('X');
	    if(vi.id !== j){
	      var ceid = vi.id.split('X');
	      var elid = '#' + typeN + '_' + ceid[0].substr(1);
	      S.select('[id='+vi.id+']').attr({opacity: OPACFOCUS, strokeDasharray: "5 5" });
	      $(elid).addClass('connected');
	    };
	  })
	});
      }
      S.selectAll(eid).attr({opacity: OPACFOCUS});
    });
    $('#labels').on("mousedown", ".label-text", function(e){
      that.selStatus[0] = $(this).parent().attr('id');
      var cid = '';
      $('#labels').on("mouseup", ".label-text:not(.pub)", function(e){
	if(S.select('#lasso')){
	  S.select('#lasso').remove();
	}
	that.selStatus[2] = $(this).parent().attr('id');
	if(that.selStatus[0] != that.selStatus[2]){
	  that.selStatus[1] = true;
	}else{
	  that.selStatus[1] = false;
	}
      })
    });
    $(document).on("mouseup", function(e){
      if(e.target.className !== "label-text"){
	that.selStatus = ['',false,''];
	if(S.select('#lasso')){
	  S.select('#lasso').remove();
	}
      }
    });
    $(document).on("mousemove", function(e){
      if(that.selStatus[0] != '' && that.selStatus[0].substr(0,1) != 1){
	if(S.select('#lasso')){
	  S.select('#lasso').remove();
	}
	if(!S.select('lasso')){
	  var fromElem = $('#'+that.selStatus[0]+'.label');
	  var posFrom = [ fromElem.position().left + (fromElem.width()/2), fromElem.position().top + (fromElem.height()/2) - HEADERH] ;
	  var currentPos = [ e.pageX, e.pageY - HEADERH ];
	  var path = 'M'+posFrom[0]+','+posFrom[1]+'L'+currentPos[0]+','+currentPos[1]
	  S.path(path).attr({ stroke: COLORS[that.selStatus[0].substr(0,1)], strokeWidth: 3, fill: "none", opacity: 0.8, id: "lasso" });
	}
      }
    });
    $('#labels').on("mouseup", ".label-text", function(e){
      lid = $(this).parent().attr('id');
      clearTimeout(to);
      setTimeout(function(){
	sel = that.selStatus;
	if(that.selStatus[1] === false && sel[0].substr(0,1) != 1){ // no lasso
	  if(that.focus[0] && that.focus[1] == lid){
	    $('hovered').remove();
	    S.clear();
	    to = that.idToSelection(sel[0], 1);
	  }else if(that.focus[1] != lid){
	    that.focus = [true, lid];
	    $('#'+lid).addClass('hovered');
	  }
	}else if(that.selStatus[1] === true && sel[0].substr(0,1) != 1 && sel[2].substr(0,1) != 1){ // lasso-end
	  S.clear();
	  to = that.idToSelection(sel[0], 1, sel[2]);
	}else if(sel[0].substr(0,1) == 1){
	  S.clear();
	  to = that.idToSelection(sel[0], 1);
	}
	that.selStatus = ['',false,''];
      }, SPEED/5);
    });
    $('#labels').on("mouseleave", ".hovered", function(e){
      var id = $(this).attr('id');
      if(!that.focus[0] || that.focus[1] != id){
	$(this).removeClass('hovered');
	$(this).children('.compare').remove();
	$('.label').removeClass('connected');
	S.selectAll('path').attr({opacity: 0.2, strokeDasharray: "0"});
      }
    });
    $('#labels').on("mouseup", ".compare", function(e){
      S.clear();
      lid = $(this).parent().attr('id');
      clearTimeout(to);
      setTimeout(function(){
	to = that.idToSelection(lid, 2);
      }, SPEED/5);
    })
    $('#labels').on("mouseup", ".label-selected-remove", function(e){
      S.clear();
      lid = $(this).parent().attr('id');
      clearTimeout(to);
      setTimeout(function(){
	to = that.idToSelection(lid, 0);
      }, SPEED/5);
    })
    $('#labels').on("mouseup", ".label-icon", function(e){
      var id = $(this).parent().attr('id');
      var splitID = id.split('_');
      var selItem = '';
      var type = '';
      var foundImage = false;
      var styles = {
	top: "",
	left: "",
	right: "",
	border: "",
	height: "",
	width: ""
      };
      $('#context').children().remove();
      $('#context').css({top: "", bottom:"", left: "", border: "", height: "", width: "", opacity: ""});
      $('#context').fadeTo(SPEED/5, 0);
      $.each(that[TYPES[splitID[0]]], function(key, item){
	if(item.id == splitID[1]){
	  selItem = item;
	}
      });
      if(that.context.visible == true && that.context.item.id == splitID[1]){
	that.context.visible = false;
      }else{
	that.context.visible = true;
	that.context.item = selItem;
	if(selItem.type === 0){
	  type = 'Autor';
	  var pos = '';
	  if(selItem.positions.length){
	    pos = '<p style=""><span class="organisation context-icon" title="Organisationseinheit">'
	      + '<i class="fa fa-building-o"></i></span>'
	      + selItem.positions.join(', ') + '</p>';
	  }
	  $('#context').append('<div id="context-head"><span class="context-label">'
	    + selItem.fullname+'</span>'+ '<span class="author"> - '+ type + '</span>' 
	    + pos
	    + '<p id="context-count"><span class="pub context-icon" title="Publikation"><i class="fa fa-file"></i></span>'
	    + selItem.count +' Publikationen</p></div>');
	  if(selItem.image){
	    var imageURL = '';
	    if(selItem.image.indexOf("http") != -1){
	      imageURL = selItem.image;
	    }else{
	      imageURL = BASEURI + selItem.image;
	    }
	    $('#context').append('<span id="context-right"><img title="VIVO-Profilfoto" style="width:80px" src="'+ imageURL +'" /></span>');
	    foundImage = true;
	  }
	  
	}else if(selItem.type === 1){
	  type = 'Publikation';
	  var date = '';
	  if(selItem.year !== null){
	    date = '<p><span class="context-icon" title="Erscheinungsjahr"><i class="fa fa-calendar"></i></span><span>'
	      + selItem.year + '</span></p>';
	  }
	  $('#context').append('<span id="context-head"><span class="context-label">'
	    + selItem.title + '</span>'+date+'</span>');
	  
	}else if(selItem.type === 2){
	  type = 'Schlagwort';
	  var exactClass = "keyword";
	  var abs = '';
	  var duration = '';
	  if(selItem.abstract && selItem.abstract != null){
	    abs = '<p><span class="context-description">'+ selItem.abstract +'</span></p>';
	  }
	  if(selItem.start && selItem.end){
	    type = 'Projekt';
	    exactClass = 'project';
	    var dStart = new Date(selItem.start);
	    var dEnd = new Date(selItem.end);
	    duration = '<p><span class="context-icon" title="Zeitraum"><i class="fa fa-calendar"></i></span><span>'
	      + dStart.getFullYear() + ' - ' + dEnd.getFullYear() +'</span></p>';
	  }
	  $('#context').append('<span id="context-head"><span class="context-label">'
	    + selItem.title + '</span>'
	    + '<span class="'+ exactClass +'"> - '+ type + '</span>'
	    + abs
	    + duration
	    + '<p id="context-count"><span class="pub context-icon" title="Publikation"><i class="fa fa-file"></i></span>'
	    + selItem.count + ' Publikationen</p></span>');
	  that.getGND(selItem.title);
	}
	if(selItem.uri.indexOf(BASEURI) !== -1){
	  vUrl = selItem.uri;
	}else{
	  vUrl = BASEURI.slice(0, -1) + "?uri=" + selItem.uri;
	}
	$('#context').append('<p id="context-links"><a target="_blank" href="'+ vUrl +'">Zum VIVO-Profil</a></p>');
	if(selItem.type === 2){
	  $('#context > p').append('<span class="loading-icon"><i class="fa fa-spinner fa-spin"></i></span>');
	}
	if(selItem.p[0][1] >= HEADERH + 200 ){
	  styles.bottom = (that.sections[0][1] - selItem.p[0][1] + 2) + 'px';
	}else{
	  styles.top = (selItem.p[1][1] + 2) + 'px';
	}
	if(selItem.type == 2 && that.sections[0][0] > SIDEMINWIDTH && !selItem.selected){
	  if(that.sections[2][0] - selItem.p[0][0] >= 300){
	    styles.left = selItem.p[0][0] + 'px';
	  }else{
	    styles.right = (OUTERMARGIN - 18) + 'px';
	  }
	}else{
	  styles.left = selItem.p[0][0] + 'px';
	}
	if(selItem.start){
	  styles.border = '2px solid' + COLORS[3];
	}else{
	  styles.border = '2px solid' + COLORS[splitID[0]];
	}
	if(foundImage){
	  styles.width = '450px';
	}else{
	  styles.minWidth = '280px';
	  styles.maxWidth = '450px';
	}
	$('#context').css(styles);
	$('#context').fadeTo(SPEED/5, 1);
      }
    })
    $(document).mouseup(function(e){
      var parent = $(e.target).parent().attr('class');
      var subject = $("#context");
      if(that.context.visible == true && parent != 'label-icon' && e.target.id != subject.attr('id') && !subject.has(e.target).length){
	that.context.visible = false;
	$('#context').children().remove();
	$('#context').css({top: "", bottom:"", left: "", border: "", height: "", width: ""});
	$('#context').fadeTo(SPEED/5, 0);
      }
      if(parent != 'suggested' && $(e.target).id != 'search'){
	$('#suggestions').css('opacity', 0);
	$('.suggested').remove();
	$('#search input').val('');
      }
    })
  }
  this.getGND = function(label){
    var url = 'http://lobid.org/subject?format=full&name=' + label;
    var obj = {};
    var gndLink = '';
    $.ajax({
      url: url,
      jsonp: 'callback',
      jsonpCallback:'JSON_CALLBACK',
      dataType: 'jsonp',
      success: function(json){
	if(json[1]){
	  json.splice(0,1);
	  $.each(json, function(k, v){
	    var subject = this['@graph'][0];
	    if(subject.preferredNameForTheSubjectHeading){
	      if(subject.preferredNameForTheSubjectHeading == label){
		obj.uri = subject['@id'];
		obj.id = subject.gndIdentifier;
		if(subject.definition){
		  obj.definition = subject.definition['@value'];
		}
	      }
	    }
	  });
	  $('.loading-icon').remove();
	  if(obj.uri){
	    $('#context > p').append('<a href="'+ obj.uri +'">GND-Eintrag</a>');
	  }
	}
      },
      error: function(e){
	console.log(this);
      }
    })
    if(obj.uri){
      return obj;
    }
  }
  this.idToSelection = function(id, mode, id2){
    var that = this;
    var splitID = [];
    var splitID2 = [];
    if(id.indexOf('_') === 1){
      splitID = id.split('_');
      if(id2){
	splitID2 = id2.split('_');
      }
    }
    if(mode === 0){
      if(that.selection[1]){
	if(that.selection[0][0] == splitID[0] && that.selection[0][1] == splitID[1]){
	  that.selection.splice(0,1);
	  $.address.value(that.selection[0][0] + '_' + that.selection[0][1]);
	}else{
	  that.selection.splice(1,1);
	  $.address.value(that.selection[0][0] + '_' + that.selection[0][1]);
	}
      }else{
	delete that.selection[0];
	that.selection[0] = [];
	that.selection[0][0] = '';
	that.selection[0][1] = '';
	$.address.value('');
      }
    }else if(mode === 1){
      if(that.selection){
	var l = that.selection.length;
	that.selection.splice(0, l);
      }
      var cid = '';
      that.selection[0] = splitID;
      if(!id2){
	cid = id;
      }else if(id2 && id2.indexOf('_') === 1){
	cid = id + ':' + id2;
	that.selection[1] = splitID2;
      }
      $.address.value(cid);
    }else if(mode === 2){
      that.selection.splice(1,1);
      that.selection[1] = splitID;
      var leftID = that.selection[0][0] + '_' + that.selection[0][1];
      $.address.value(leftID+':'+id);
    }
    that.updateLabels();
  }
  this.showSuggestions = function(term){
    var that = this;
    var sugg = [];
    $.each(that.data.authors, function(k, author){
      if(this.fullname.toLowerCase().indexOf(term.toLowerCase()) >=0){
	if(sugg.length <= MAXSUGGESTIONS){
	  sugg.push(this);
	}
      }
    });
    $.each(that.data.publications, function(k, pub){
      if(this.title.toLowerCase().indexOf(term.toLowerCase()) >=0){
	if(sugg.length <= MAXSUGGESTIONS){
	  sugg.push(this);
	}
      }
    });
    $.each(that.data.keywords, function(k, keyw){
      if(this.title.toLowerCase().indexOf(term.toLowerCase()) >=0){
	if(sugg.length <= MAXSUGGESTIONS){
	  sugg.push(this);
	}
      }
    });
    if(sugg.length){
      $('#suggestions').css('opacity', 1);
      $.each(sugg, function(k, s){
	var type = null;
	switch(s.type){
	  case 0: type = 'author'; break;
	  case 1: type = 'pub'; break;
	  case 2: if(s.start){ type = 'project'; break; }else{ type = 'keyword'; break;}
	}
	if(s.fullname){
	  $('#suggestions').append('<div id="'+s.type+'_'+s.id+'" class="suggested '+type+'"><span>'+s.fullname+'</span></div>');
	}else{
	  $('#suggestions').append('<div id="'+s.type+'_'+s.id+'" class="suggested '+type+'"><span>'+s.title+'</span></div>');
	}
      });
    };
  }
  this.getOffsets = function(){
    var that = this;
    var sel = that.selected.length;
    var selHeight = sel*2*FONTMAX;
    var pubsTotal = that.pubSplit.top.length + that.pubSplit.mid.length + that.pubSplit.bottom.length;
    var maxpubs = Math.floor((that.sections[0][1] - HEADERH - selHeight)/(2*that.fontsize));
    var withinLimits = [0,0];
    $.each(that.pubSplit, function(key, pubs){
      v =  '';
      if(this.length <= Math.ceil(maxpubs/3)){
	withinLimits[0]++;
	withinLimits[1] += this.length;
      }
    });
    if(pubsTotal > maxpubs){
      $.each(that.pubSplit, function(key, pubs){
	if(this.length > Math.ceil(maxpubs/3)){
	  if(withinLimits[0] == 0){
	    that.offsets[key][1] = Math.floor(maxpubs/3);
	  }else if(withinLimits[0] == 1){
	    that.offsets[key][1] = Math.floor((maxpubs - withinLimits[1])/2) - 1;
	  }else if(withinLimits[0] == 2){
	    that.offsets[key][1] = (maxpubs - withinLimits[1] - 1)
	  }
	}else{
	  that.offsets[key][1] = this.length ? this.length-1 : 0;
	}
      })
    }else{
      $.each(that.offsets, function(key, array){
	this[1] = that.pubSplit[key].length ? that.pubSplit[key].length-1 : 0;
      })
    }
  }
  this.drawLabels = function(){
    var that = this;
    var combID = '';
    var remElem = '<span class="label-selected-remove" title="Remove"><i class="fa fa-times"></i></span>';
    var rem = '';
    var sel = '';
    $('.label').remove();
    S.clear();
    that.getOffsets();
    $.each(that.pubSplit, function(key, pubs){
      for(i=0;i<pubs.length;i++){
	if(pubs[i]){
	  var pub = pubs[i];
	  var iid = '#'+ pub.type + '_' + pub.id;
	  sel = '';
	  rem = '';
	  combID = pub.type + '_' + pub.id;
	  for(j=0;j<that.selected.length;j++){
	    if(combID === that.selected[j]){
	      sel = ' selected';
	      rem = remElem;
	      pub.selected = j+1;
	    }
	  }
	  if(sel === ''){
	    delete pub.selected;
	  }
	  var shortt = that.shortenLabel(pub.type, pub.title);
	  var maxwidth = that.sections[1][0] - that.sections[0][0];
	  var pos = [];
	  if(i <= that.offsets[key][1] && i >= that.offsets[key][0]){
	    pos = that.getPos(pub, i, key);
	    $('#labels').append('<div id="'+pub.type+'_'+pub.id+'" class="label pub' 
	    + sel + '" style="font-size:' + that.fontsize + 'px;left:' + pos[0][0] + 'px;top:' + pos[0][1]
	    + 'px;max-width:'+maxwidth+'px;"><span title="Publikation" class="label-icon"><i class="fa fa-file"></i></span><span class="label-text" title="'
	    + pub.title + '\n (' + pub.year + ')">' +shortt + '</span>' + rem + '</div>');
	    var w = $(iid).width();
	    var h = $(iid).height();
	    pos[1][0] = pos[0][0] + w + 12;
	    pos[1][1] = pos[0][1] + h + 10;
	    pub.p = pos;
	    pub.active = true;
	    pos = [];
	  }else{
	    delete pub.active;
	    pub.active = false;
	  }
	}
      }
    });
    
    for(i=0; i < that.authors.length; i++){
      if(that.authors[i]){
	var a = that.authors[i];
	combID = a.type + '_' + a.id;
	sel = '';
	rem = '';
	for(j=0;j<that.selected.length;j++){
	  if(combID === that.selected[j]){
	    sel = ' selected';
	    rem = remElem;
	    a.selected = j+1;
	  }
	}
	if(sel === ''){
	  delete a.selected;
	}
	var pos = that.getPos(a, i);
	var iid = '#'+ a.type + '_' + a.id;
	if(pos[0][1] !== false){
	  $('#labels').append('<div id="' + a.type + '_' + a.id + '" class="label author'
	    + sel + '" style="left:' + pos[0][0] + 'px;top:' + pos[0][1]
	    + 'px;"><span title="Autor" class="label-icon"><i class="fa fa-user"></i></span><span class="label-text">'
	    + a.name + '</span>' + rem + '</div>');
	  var w = $(iid).width();
	  var h = $(iid).height();
	  pos[1][0] = pos[0][0] + w + 10;
	  pos[1][1] = pos[0][1] + h + 10;
	  a.p = pos;
	  a.active = true;
	}
      }
    };
    for(i=0; i < that.keywords.length; i++){
      if(that.keywords[i]){
	var css = 'keyword';
	var icon = 'fa fa-tag';
	var title = 'Konzept';
	var k = that.keywords[i];
	if(k.start){
	  css = 'project';
	  icon = 'fa fa-briefcase';
	  title = 'Projekt';
	}
	combID = k.type + '_' + k.id;
	sel = '';
	rem = '';
	for(j=0;j<that.selected.length;j++){
	  if(combID === that.selected[j]){
	    sel = ' selected';
	    rem = remElem;
	    k.selected = j+1;
	  }
	}
	if(sel === ''){
	  delete k.selected;
	}
	var shortt = that.shortenLabel(k.type, k.title);
	var pos = that.getPos(k, i);
	var iid = '#'+ k.type + '_' + k.id;
	if(pos[0][1] != false){
	  if(that.sections[0][0] > SIDEMINWIDTH && !k.selected){
	    $('#labels').append('<div id="' + k.type + '_' + k.id + '" class="label ' 
	      + css + sel +'" style="left:' + pos[0][0] + 'px;top:' + pos[0][1] 
	      + 'px;"><span title="'+title+'" class="label-icon"><i class="'+ icon +'"></i></span><span class="label-text">'
	      + shortt + '</span>' + rem + '</div>');
	    var w = $(iid).width();
	    var h = $(iid).height();
// 	    pos[1][0] = that.sections[2][0] - pos[1][0];
	    pos[1][0] = pos[1][0] + w;
	  }else{
	    $('#labels').append('<div id="' + k.type + '_' + k.id + '" class="label '
	      + css + sel +'" style="left:' + pos[0][0] + 'px;top:'+ pos[0][1]
	      + 'px;"><span title="'+title+'" class="label-icon"><i class="'+ icon +'"></i></span><span class="label-text">'
	      + shortt + '</span>' + rem + '</div>');
	    var w = $(iid).width();
	    var h = $(iid).height();
	    pos[1][0] = pos[0][0] + w + 10;
	  }
	  pos[1][1] = pos[0][1] + h + 10;
	  k.p = pos;
	  k.active = true;
	}
      }
    };
    $('.label.selected').not('.pub').css('font-size', that.fontsize);
    $('.label').fadeTo(SPEED, 1);
    that.drawEdges();
  }
  this.drawEdges = function(){
    var that = this;
    var w = that.sections[1][0] - that.sections[0][0];
    $.each(that.authors, function(k, a){
      if(a && a.publications && !a.selected && a.active === true){
	$.each(a.publications, function(pubID){
	  $.each(that.pubSplit, function(sector, pubs){
	    $.each(pubs, function(gk, gv){
	      if(pubID == gv.id && gv.active){
		var edgeID = 'a'+a.id+'Xp'+gv.id;
		var mya = ((a.p[0][1] + a.p[1][1]) / 2) - HEADERH;
		var myp = ((gv.p[0][1] + gv.p[1][1]) / 2) - HEADERH;
		var cx = (a.p[1][0] + gv.p[0][0]) / 2;
		var path = 'M'+ a.p[1][0] + ',' + mya + ' C' + cx + ',' + mya + ' ' + cx + ',' + myp + ' ' + gv.p[0][0] + ',' + myp;
		S.path(path).attr({stroke: COLORS[a.type], strokeWidth: 1, fill: "none", opacity: 0, class: "path", id: edgeID });
	      }
	    });
	  });
	});
      }
    });
    $.each(that.keywords, function(k, a){
      if(a && a.publications && !a.selected && a.active === true){
	var t = a.type;
	if(a.start && a.type == 2){
	  t = 3;
	}
	$.each(a.publications, function(pubID){
	  $.each(that.pubSplit, function(sector, pubs){
	    $.each(pubs, function(gk, gv){
	      if(pubID == gv.id && gv.active){
		var edgeID = 'k'+a.id+'Xp'+gv.id;
		var mya = ((a.p[0][1] + a.p[1][1]) / 2) - HEADERH;
		var myp = ((gv.p[0][1] + gv.p[1][1]) / 2) - HEADERH;
		if(that.sections[0][0] > SIDEMINWIDTH){
		  var cx = (a.p[0][0] + gv.p[1][0]) / 2;
		  var path = 'M'+ a.p[0][0] + ',' + mya + ' C' + cx + ',' + mya + ' ' + cx + ',' + myp + ' ' + gv.p[1][0] + ',' + myp;
		}else{
		  var cx = (a.p[1][0] + gv.p[0][0]) / 2;
		  var path = 'M'+ a.p[1][0] + ',' + mya + ' C' + cx + ',' + mya + ' ' + cx + ',' + myp + ' ' + gv.p[0][0] + ',' + myp;
		}
		S.path(path).attr({ stroke: COLORS[t], strokeWidth: 1, fill: "none", opacity: 0, class: "path", id: edgeID });
	      }
	    });
	  });
	});
      }
    });
    $.each(that.pubSplit, function(sector, pubs){
      if(this.length){
	var l = this.length;
	var active = that.offsets[sector][1] - that.offsets[sector][0] + 1;
	var inactive = l - active;
	var text = '';
	if(l > active){
	  text = '+' + inactive + ' Publ.'; 
	}
	
	S.text(that.sections[0][0] + MAXSIDELABELWIDTH, pubs[that.offsets[sector][1]].p[1][1] - HEADERH + FONTMAX, text).attr({ fill: '#777'});
      }
    });
    S.selectAll('.path').animate({opacity: 0.2}, SPEED/2);
  }
  this.getPos = function(item, no, sector){
    var that = this;
    var sel = that.selected.length;
    var selHeight = sel*2*FONTMAX;
    var p = [[],[]];
    var space = null;
    var maxpubs = Math.floor((that.sections[0][1] - HEADERH - selHeight)/(2*that.fontsize));
    var totalPubs = that.pubSplit.top.length + that.pubSplit.mid.length + that.pubSplit.bottom.length;
    if(totalPubs > 0 && totalPubs <= maxpubs){
      space = (that.sections[1][1] - HEADERH - that.fontsize) / (totalPubs + sel);
    }else{
      space = (that.sections[1][1] - HEADERH - selHeight - that.fontsize) / (maxpubs);
    }
    if(item.type == 1){ // PUBLICATION
      p[0][0] = that.sections[0][0] + BORDERS;
      if(that.selected.length == 2){
	if(sector == 'top'){
	  p[0][1] = HEADERH + space*no + (space/3);
	}else if(sector == 'mid'){
	  p[0][1] = HEADERH + space*(no + that.offsets.top[1] + 1) 
	    + 0.4*(that.pubSplit.top.length ? selHeight : 0) + (space/3);
	}else if(sector == 'bottom'){
	  p[0][1] = HEADERH + space*(no + that.offsets.top[1] + 1 + that.offsets.mid[1] + 1) 
	    + 0.4*(that.pubSplit.top.length ? selHeight : 0) 
	    + 0.4*(that.pubSplit.mid.length ? selHeight : 0) + (space/3);
	}
	
      }else if(that.selected.length == 1){
	p[0][1] = HEADERH + space*no + selHeight + (space/3);
      }
    }
    else{ // not SELECTED, no publication
      if(!item.selected){
	var i = 0;
	if(item.type == 0 || that.sections[0][0] == SIDEMINWIDTH){
	  $.each(that.authors, function(ak, av){
	    
	  });
	  p[0][0] = that.sections[0][0] - (0.6*that.sections[0][0]);
	}else if(item.type == 2 && that.sections[0][0] > SIDEMINWIDTH){
	  p[0][0] = that.sections[1][0] + 0.3*(that.sections[2][0] - that.sections[1][0] - MAXSIDELABELWIDTH);
	  
	}
	p[0][1] = 0;
	$.each(item.publications, function(ik,iv){
	  $.each(that.pubSplit, function(sector,pubs){
	    $.each(pubs, function(pk, pv){
	      if(ik == pv.id && pv.active != false){
		var pid = '#'+ 1 + '_' + ik;
		var ppos = $(pid).offset();
		var ph = $(pid).height();
		var ypos = (2*ppos.top + ph)/2 - that.fontsize/2;
		p[0][1] += ypos;
		i++;
	      }
	    })
	  })
	});
	if(i > 0){
	  p[0][1] /= i;
	  if(p[0][1] <= that.sections[0][1]/2){
	    p[0][1] += 30;
	  }else{
	    p[0][1] -= 30;
	  }
	  if(item.type == 0 || that.sections[0][0] == SIDEMINWIDTH){
	    p[0][0] -= (i-1)*80;
	    if(p[0][0] <= OUTERMARGIN){
	      p[0][0] = OUTERMARGIN;
	    }
	  }else{
	    p[0][0] += (i-1)*80;
	    if(p[0][0] >= that.sections[2][0] - MAXSIDELABELWIDTH){
	      p[0][0] = that.sections[2][0] - MAXSIDELABELWIDTH;
	    }
	  }
	}else{
	  // Show labels without active publications?
	  // var rndY = Math.random()*(that.sections[0][1] - HEADERH - FONTMAX); 
	  // p[0][1] = HEADERH + rndY;
	  p[0][1] = false;
	}
	if(p[0][1] !== false){ // spot and fix possible overlapping
	  var ol = false;
	  var slots = Math.ceil((that.height - HEADERH)/FONTMAX);
	  var changeW = 0;
	  var minoverlap = p[0][1] - 6*BORDERS;
	  var maxoverlap = p[0][1] + FONTMAX + 6*BORDERS;
	  if(item.type == 0){
	    oa = $('.label.author').not('.selected');
	  }else if(item.type == 2){
	    if(that.sections[0][0] > SIDEMINWIDTH){
	      oa = $('.label.keyword, .label.project').not('.selected');
	    }else{
	      oa = $('.label').not('.pub, .selected');
	    }
	  }
	  for(i=0;i<=slots;i++){
	    $.each(oa, function(k,v){   
	      var otherT = parseInt($(this).css('top'), 10);
	      var otherH = $(this).height();
	      
	      if(otherT + otherH >= minoverlap && otherT <= maxoverlap){
		var olmin = (otherT+otherH) - p[0][1];
		var olmax = otherT - (p[0][1] + otherH);
		if(i<8){
		  if(olmin >= olmax){
		    p[0][1] += olmin + BORDERS + that.fontsize;
		  }else{
		    p[0][1] += olmax - BORDERS - that.fontsize;
		  }
		}else{
		  p[0][1] = HEADERH + (i-7)*FONTMAX + 6;
		}
		ol = true;
	      }else{
		ol = false;
	      }
	      if(p[0][1] <= HEADERH){
		p[0][1] = that.sections[0][1] - FONTMAX - BORDERS;
	      }else if(p[0][1] >= that.sections[0][1] - FONTMAX){
		p[0][1] = HEADERH + 6;
	      }
	      minoverlap = p[0][1] - 6*BORDERS;
	      maxoverlap = p[0][1] + that.fontsize + 6*BORDERS;
// 	      if(p[0][1] >= that.sections[0][1] - FONTMAX - that.fontsize || p[0][1] <= HEADERH){
// 		if(p[0][1] !== false){
// 		  var rndY = Math.random()*(that.sections[0][1] - HEADERH - FONTMAX); 
// 		  p[0][1] = HEADERH + rndY;
// 		}
// 	      }
	    });
// 	    if(that.sections[0][0] != SIDEMINWIDTH){
// 	      $.each(oa, function(k,v){   
// 		var t = parseInt($(this).css('top'), 10);
// 		var h = $(this).height();
// 		var w = $(this).width();
// 		var xpos = '';
// 		if(item.type == 0 || that.sections[0][0] == SIDEMINWIDTH){
// 		  xpos = parseInt($(this).css('left'),10);
// 		}else if(item.type == 2 && that.sections[0][0] > SIDEMINWIDTH){
// 		  xpos = parseInt($(this).css('left'),10)
// 		}
// 		if(t + h >= minoverlap && t <= maxoverlap && xpos == OUTERMARGIN + BORDERS){
// 		  changeW = w;
// 		}
// 	      });
// 	    }
// 	    if(changeW != 0){
// 	    }
	  }
	  if(ol == true){
	      if(item.type == 0 || that.sections[0][0] == SIDEMINWIDTH){
		p[0][0] += MAXSIDELABELWIDTH;
	      }else if(item.type == 2 && that.sections[0][0] > SIDEMINWIDTH){
		p[0][0] -= MAXSIDELABELWIDTH;
	      }
	  }
	}else{
	  p[0][1] = false;
	}
      }else{  // SELECTED, not publication
	p[0][0] = that.sections[0][0] + BORDERS;
	var pubsTop = that.pubSplit.top;
	var pubsMid = that.pubSplit.mid;
	var pubsBot = that.pubSplit.bottom;
	if(that.selected.length === 2){
	  var xTop = '';
	  if(item.selected == 1){
	    if(pubsTop.length && pubsMid.length){
	      p[0][1] = pubsTop[that.offsets['top'][1]].p[1][1] + space/2 - (0.5*that.fontsize + 4*BORDERS);
	    }else if(!pubsTop.length){
	      p[0][1] = pubsMid[0].p[0][1] - space/2 - 0.5*that.fontsize;
	    }else if(pubsTop.length && !pubsMid.length){
	      p[0][1] = pubsTop[that.offsets['top'][1]].p[1][1] + space/2 - (0.5*that.fontsize + 4*BORDERS);
	    }
	  }else if(item.selected == 2){
	    if(pubsMid.length && pubsBot.length){
	      p[0][1] = pubsMid[that.offsets['mid'][1]].p[1][1] + space/2 - (0.5*that.fontsize + 4*BORDERS);
	    }else if(!pubsMid.length){
	      if(totalPubs >= maxpubs){
// 		p[0][1] = pubsTop[that.offsets['top'][1]].p[1][1] + space/2 - (0.5*that.fontsize + 2*BORDERS);
		p[0][1] = pubsBot[0].p[0][1] - space/2 - (0.5*that.fontsize + 2*BORDERS);
// 		p[0][0] = that.sections[0][0] + BORDERS + MAXSIDELABELWIDTH;
	      }else{
		p[0][1] = pubsBot[0].p[0][1] - space/2 - (0.5*that.fontsize + 2*BORDERS);
//		p[0][0] = that.sections[0][0] + BORDERS + MAXSIDELABELWIDTH;
	      }
	    }else if(pubsMid.length && !pubsBot.length){
	      p[0][1] = pubsMid[that.offsets['mid'][1]].p[1][1] + space/2 - (0.5*that.fontsize + 4*BORDERS);
	    }
	  }
	}else if(that.selected.length === 1){
	  if(pubsTop.length){
	    p[0][1] = (HEADERH + pubsTop[0].p[0][1])/2 - (0.5*that.fontsize + 4*BORDERS);
	  }else{
	    p[0][1] = (HEADERH + 100) - (0.5*that.fontsize + 4*BORDERS);
	  }
	}
      }
    }
    return p;
  }
  this.shortenLabel = function(type, label){
    var that = this;
    function getTextWidth(text, font) {
	var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
	var context = canvas.getContext("2d");
	context.font = font;
	var metrics = context.measureText(text);
	return metrics.width;
    };
    function trimByPixel(str, width) {
      var spn = $('<span class="temp" style="visibility:hidden;font-size:'+that.fontsize+'"></span>').text(str).appendTo('body');
      var txt = str;
      while (spn.width() > width) { txt = txt.slice(0, -1); spn.text(txt + "..."); }
      return txt;
    }
    var lwidth = getTextWidth(label, that.fontsize+" Helvetica" );
    var slabel = '';
    var that =  this;
    var mwidth = that.sections[1][0] - that.sections[0][0];
    if(type === 1){
      if(lwidth >= mwidth - 17*that.fontsize){
	slabel = trimByPixel(label, mwidth - 10*that.fontsize);
	slabel += "...";
      }else{
	slabel = label;
      }
    }else{
      if(lwidth >= MAXSIDELABELWIDTH){
	slabel = trimByPixel(label, MAXSIDELABELWIDTH);
      }else{
	slabel = label;
      }
    }
    $('.temp').remove();
    return slabel;
  }
  this.interval = function (x, xmin, xmax, ymin, ymax, bound) {
    if (typeof bound === 'undefined') bound = false;
    if (xmin == xmax) {
      return ymax;
    }
    var m = (ymax - ymin) / (xmax - xmin);
    var n = - xmin * m + ymin;
    var y = x * m + n;
    if (bound) {
      y = Math.min(ymax, y);
      y = Math.max(ymin, y);
    }
    return y;
  };
};
