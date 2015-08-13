var SPEED = 500;
var FONTMIN = 10;
var FONTMAX = 20;
var MIDMINWIDTH = 200;
var SIDEMINWIDTH = 200;
var HEADERH = 40;
var SEARCHPH = "search!";
var TYPES = { 0: "authors", 1: "publications", 2: "keywords" };
var BORDERS = 2;
var OPACFOCUS = 0.8;

function View(svg){
  var S = Snap(svg);
  this.init = function() {
    this.selection = this.getPars();
    this.maxrecords = 10;
    this.width = $(window).width();
    this.height = $(window).height();
    this.sections = this.setSections();
    S.attr({
      width: this.width, 
      height: this.height - HEADERH
    });
    $('#search input').attr('placeholder', SEARCHPH);
    this.fontsize = this.interval(this.width * this.height, 800 * 600, 2560 * 1600, FONTMIN, FONTMAX, false);
    this.authors = [];
    this.publications = [];
    this.keywords = [];
    this.events();
    this.getData();
    this.edges = [];
    
    return this;
  };
  this.setSections = function(){
    var w = $(window).width();
    var h = $(window).height();
    var s = [];
    if(w/3 >= SIDEMINWIDTH){
      s[0] = [w/3, h];
      s[1] = [w*2/3, h];
      s[2] = [w, h];
    }else{
      s[0] = [200, h];
      s[1] = [w, h];
      s[2] = s[0];
    }
    return s;
  }
  this.getData = function(){
    var that = this;
    jQuery.getJSON("data/data.json", function(r,s){
      view.data = r[0];
      if(that.selection != ''){
	that.updateLabels();
      }
    });
  }
  this.getPars = function(){
    var parString = window.location.search.substring(1);
    var pars = parString.split('&');
    var ret = [];
    for(var i = 0; i < pars.length; i++){
	var pair = pars[i].split('=');
	ret.push(pair);
    }
    return ret;
  };
  this.updateLabels = function(){
    var that = this;
    var sel = {
      type: that.selection[0][0] + "s",
      value: that.selection[0][1]
    }
    $.each(TYPES, function(k,v){
      if(sel.type === v){
	for(a in that.data[sel.type]){
	  if(that.data[sel.type][a].id == sel.value){
	    var s = that.data[sel.type][a];
	    s.selected = 1;
	    that[sel.type].push(s);
	    $.each(TYPES, function(key, val){
	      for(id in s[val]){
		for(rel in that.data[val]){
		  if(that.data[val][rel].id == id){
		    that[val].push(that.data[val][rel]);
		  }
		}
	      }
	    });
	  }
	}
      }
    });
    this.drawLabels();
    this.drawEdges();
  };
  this.events = function(){
    var that = this;
    var edges = null;
    var labels = null;
    $('#search input').focus(function(){
      $(this).attr('placeholder', '');
    });
    $('#search input').blur(function(){
      $(this).attr('placeholder', SEARCHPH);
    });
    $('#search input').keyup(function(){
      var searchTerm = $(this).val();
      var addDiv = 0;
      $('.suggested').remove();
      $('#suggestions').css('opacity', 0);
      if(searchTerm != ''){
	that.showSuggestions(searchTerm);
      }
    });
    $('#suggestions').unbind;
    $('#suggestions').on("mouseup", ".suggested", function(e){
	var sid = $(this).attr('id');
	$('#suggestions').css('opacity', 0);
	$('.suggested').remove();
	$('#search input').val('');
	S.clear();
	view.authors = [];
	view.publications = [];
	view.keywords = [];
	$('.label').fadeTo(SPEED, 0);
	setTimeout(function(){
	  that.idToSelection(sid);
	},SPEED);
    });
    $(window).resize(function (e){
      view.sections = that.setSections();
      var noh = view.sections[0][1] - HEADERH;
      S.clear();
      S.attr({
	width: that.width, 
	height: noh
      });
      $('.label').fadeTo(SPEED, 0);
      clearTimeout(edges);
      clearTimeout(labels);
      setTimeout(function(){
	S.clear();
	labels = that.drawLabels();
	edges = that.drawEdges();
      }, SPEED);
    });
    $('#labels').on("mouseenter", ".label", function(e){
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
	eid = '[id^=' + typeC + id + ']';
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
	  $('#1_' + pid[1].substr(1)).addClass('connected');
	  $.each(indirCross, function(ki, vi){
	    var conid = "[id=" + vi.id + "]";
	    var ceid = vi.id.split('X');
	    var elid = '#' + opp.no + '_' + ceid[0].substr(1);
	    console.log(elid);
	    S.select(conid).attr({opacity: OPACFOCUS});
	    $(elid).addClass('connected');
	  });
	  $.each(indirSame, function(ki, vi){
	    var j = pid.join('X');
	    if(vi.id != j){
	      var ceid = vi.id.split('X');
	      var elid = '#' + typeN + '_' + ceid[0].substr(1);
	      $(elid).addClass('connected');
	    };
	  })
	});
      }
      S.selectAll(eid).attr({opacity: OPACFOCUS});
    });
    $('#labels').on("mouseleave", ".hovered", function(e){
      $(this).removeClass('hovered');
      $('.label').removeClass('connected');
      S.selectAll('path').attr({opacity: 0.2});
    });
  }
  this.idToSelection = function(id){
    var that = this;
    var splitID = [];
    if(id.indexOf('_') == 1){
      splitID = id.split('_');
    }
    if(splitID[0] === '0'){
      view.selection[0][0] = 'author';
    }else if(splitID[0] === '1'){
      view.selection[0][0] = 'publication';
    }else if(splitID[0] === '2'){
      view.selection[0][0] = 'keyword';
    }
    view.selection[0][1] = splitID[1];
    window.location.search='?'+ view.selection[0][0] + '=' + view.selection[0][1];
    that.updateLabels();
  }
  this.showSuggestions = function(term){
    var that = this;
    var sugg = [];
    $.each(that.data.authors, function(k, author){
      if(author.fullname.indexOf(term) >=0){
	if(sugg.length <= 15){
	  sugg.push(author);
	}
      }
    });
    $.each(that.data.publications, function(k, pub){
      if(pub.title.indexOf(term) >=0){
	if(sugg.length <= 15){
	  sugg.push(pub);
	}
      }
    });
    $.each(that.data.keywords, function(k, keyw){
      if(keyw.title.indexOf(term) >=0){
	if(sugg.length <= 15){
	  sugg.push(keyw);
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
	  case 2: type = 'keyword'; break;
	}
	if(s.fullname){
	  $('#suggestions').append('<div id="'+s.type+'_'+s.id+'" class="suggested '+type+'"><span>'+s.fullname+'</span></div>');
	}else{
	  $('#suggestions').append('<div id="'+s.type+'_'+s.id+'" class="suggested '+type+'"><span>'+s.title+'</span></div>');
	}
      });
    };
  }
  this.drawLabels = function(){
    var that = this;
    var lastpos = {top: HEADERH };
    var lasth = 0;
    $('.label').remove();
    for(i=0; i < that.publications.length; i++){
      var pub = that.publications[i];
      var maxpubs = 10;
      var iid = '#'+ pub.type + '_' + pub.id;
      var maxwidth = that.sections[1][0] - that.sections[0][0];
      var hleft = that.sections[0][1] - lastpos.top + lasth;
      var pos = [];
      if(i < maxpubs && hleft >= 200){
	if(i > 0){
	  pos = that.getPos(pub.type, i, pub);
	}else{
	  pos = that.getPos(pub.type, i, 0);
	}
	$('#labels').append('<div id="'+pub.type+'_'+pub.id+'" class="label pub" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;max-width:'+maxwidth+'px;"><span style="">'+pub.title+' ('+pub.year+')</span></div>');
	var w = $(iid).width();
	var h = $(iid).height();
	pos[1][0] = pos[0][0] + w + 12;
	pos[1][1] = pos[0][1] + h + 10;
	view.publications[i].p = pos;
	view.publications[i].active = true;
      }
      lastpos = $(iid).offset();
      lasth = $(iid).height();
    };
    for(i=0; i < that.authors.length; i++){
      var a = that.authors[i];
      var pos = that.getPos(a.type, i, a);
      var iid = '#'+ a.type + '_' + a.id;
      if(pos[0][1] !== false){
	$('#labels').append('<div id="'+a.type+'_'+a.id+'" class="label author" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;"><span>'+a.name+'</span></div>');
	var w = $(iid).width();
	var h = $(iid).height();
	pos[1][0] = pos[0][0] + w + 10;
	pos[1][1] = pos[0][1] + h + 10;
	view.authors[i].p = pos;
	view.authors[i].active = true;
      }
    };
    for(i=0; i < that.keywords.length; i++){
      var k = that.keywords[i];
      var pos = that.getPos(k.type, i, k);
      var iid = '#'+ k.type + '_' + k.id;
      if(pos[0][1] !== false){
	$('#labels').append('<div id="'+k.type+'_'+k.id+'" class="label keyword" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;"><span>'+k.title+'</span></div>');
	var w = $(iid).width();
	var h = $(iid).height();
	pos[1][0] = pos[0][0] + w + 10;
	pos[1][1] = pos[0][1] + h + 10;
	view.keywords[i].p = pos;
	view.keywords[i].active = true;
      }
    };
    $('.label').fadeTo(SPEED, 1);
  }
  this.drawEdges = function(){
    var that = this;
    var stroke = '#3377CC';
    $.each(that.authors, function(k, a){
      if(a.publications && !a.selected){
	$.each(a.publications, function(kp, vp){
	  $.each(that.publications, function(gk, gv){
	    if(kp == gv.id && gv.active){
	      var edgeID = 'a'+a.id+'Xp'+gv.id;
	      var mya = ((a.p[0][1] + a.p[1][1]) / 2) - HEADERH;
	      var myp = ((gv.p[0][1] + gv.p[1][1]) / 2) - HEADERH;
	      var cx = (a.p[1][0] + gv.p[0][0]) / 2;
	      // view.edges[0].push(edge);
	      var path = 'M'+ a.p[1][0] + ',' + mya + ' C' + cx + ',' + mya + ' ' + cx + ',' + myp + ' ' + gv.p[0][0] + ',' + myp;
	      S.path(path).attr({stroke: stroke, strokeWidth: 1, fill: "none", opacity: 0, class: "path", id: edgeID });
	    }
	  });
	});
      }
    });
    $.each(that.keywords, function(k, a){
      var stroke = '#CC7733';
      if(a.publications && !a.selected){
	$.each(a.publications, function(kp, vp){
	  $.each(that.publications, function(gk, gv){
	    if(kp == gv.id && gv.active){
	      var edgeID = 'k'+a.id+'Xp'+gv.id;
	      var mya = ((a.p[0][1] + a.p[1][1]) / 2) - HEADERH;
	      var myp = ((gv.p[0][1] + gv.p[1][1]) / 2) - HEADERH;
	      var rmid = that.sections[1][0] + 6;
	      // view.edges[0].push(edge);
	      if(that.sections[0][0] > 200){
		var cx = (a.p[0][0] + gv.p[1][0]) / 2;
		var path = 'M'+ a.p[0][0] + ',' + mya + ' C' + cx + ',' + mya + ' ' + cx + ',' + myp + ' ' + gv.p[1][0] + ',' + myp;
	      }else{
		var cx = (a.p[1][0] + gv.p[0][0]) / 2;
		var path = 'M'+ a.p[1][0] + ',' + mya + ' C' + cx + ',' + mya + ' ' + cx + ',' + myp + ' ' + gv.p[0][0] + ',' + myp;
	      }
	      S.path(path).attr({ stroke: stroke, strokeWidth: 1, fill: "none", opacity: 0, class: "path", id: edgeID });
	    }
	  });
	});
      }
    });
    S.selectAll('.path').animate({opacity: 0.2}, SPEED/2);
  }
  this.getPos = function(type, no, item){
    var that = this;
    var p = [[],[]];
    var space = null;
    if(that.publications.length <= that.maxrecords){
      space = that.sections[1][1] / that.publications.length;
    }else{
      space = that.sections[1][1] / that.maxrecords;
    }
    if(type == 1){
      p[0][0] = that.sections[0][0] + BORDERS;
/*      if(item != 0){
	var iid = '#'+ type + '_' + item.id;
	var ppos = $(iid).position();
	var ph = $(iid).height();
	var pw = $(iid).width();
	p[0][1] = ppos.top + ph + 30;
      }else{
	p[0][1] = HEADERH + 50;
      }  */
      p[0][1] = space*no + (space/2);
    }
    else{
      if(!item.selected){
	var i = 0;
	if(item.type == 0 || that.sections[0][0] == 200){
	  $.each(that.authors, function(ak, av){
	    
	  });
	  p[0][0] = 50 + BORDERS;
	}else if(item.type == 2 && that.sections[0][0] > 200){
	  p[0][0] = that.sections[2][0] - 250  + BORDERS;
	}
	p[0][1] = 0;
	$.each(item.publications, function(ik,iv){
	  $.each(that.publications, function(pk,pv){
	    if(ik == pv.id){
	      var pid = '#'+ 1 + '_' + ik;
	      var ppos = $(pid).offset();
	      var ph = $(pid).height();
	      p[0][1] += (2*ppos.top + ph)/2 - that.fontsize/2;
	      i++;
	    }
	  })
	});
	if(i > 0){
	  p[0][1] /= i;
	  var ol = '';
	  if(item.type == 0){
	    oa = $('.label.author');
	  }else if(item.type == 2){
	    oa = $('.label.keyword');
	  }
	  var minoverlap = p[0][1]-FONTMAX;
	  var maxoverlap = p[0][1]+FONTMAX;
	  $.each(oa, function(k,v){
	    var t = parseInt($(this).css('top'), 10);
	    var l = $(this).css('left');
	    var w = $(this).width();
	    if(t >= minoverlap && t <= maxoverlap){
	      if(item.type == 2 && that.sections[0][0] > 200){
		p[0][0] -= w + FONTMAX + BORDERS;
	      }else{
		p[0][0] += w + FONTMAX + BORDERS;
	      }
	     // p[0][1] += FONTMAX + BORDERS;
	    }
	  });
	}else{
	  p[0][1] = false;
	}
      }else{
	p[0][0] = 50 + BORDERS;
	p[0][1] = 20 + HEADERH;
      }
    }
    return p;
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