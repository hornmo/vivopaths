var SPEED = 500;
var FONTMIN = 10;
var FONTMAX = 20;
var MIDMINWIDTH = 200;
var SIDEMINWIDTH = 300;
var HEADERH = 60;
var SEARCHPH = "search!";
var TYPES = { 0: "authors", 1: "publications", 2: "keywords" };
var BORDERS = 2;
var OPACFOCUS = 0.8;
var MAXSIDELABELWIDTH = 200;
var OUTERMARGIN = 50;

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
    this.authors = {};
    this.selected = {};
    this.publications = {};
    this.keywords = {};
    this.events();
    this.getData();
    this.edges = [];
    this.wait = 0;
    
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
      s[0] = [SIDEMINWIDTH, h];
      s[1] = [w, h];
      s[2] = s[0];
    }
    return s;
  }
  this.getData = function(){
    var that = this;
    jQuery.getJSON("data/data.json", function(r,s){
      that.data = r[0];
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
	ret.push(pair);
    }
    return ret;
  };
  this.updateLabels = function(){
    delete this.authors;
    delete this.keywords;
    delete this.publications;
    delete this.selected;
    this.selected = [];
    this.authors = [];
    this.keywords = [];
    this.publications = [];
    var that = this;
    var s = {};
    var sel = {
      type: TYPES[that.selection[0][0]],
      value: that.selection[0][1]
    }
    $.each(TYPES, function(k,v){
      if(sel.type == this){
	$.each(that.data[sel.type], function(ik, iv){
	  if(this.id == sel.value){
	    that[sel.type].push(this);
	    that.selected.push(this);
	    $.each(TYPES, function(key, val){
	      for(id in that.selected[0][val]){
		for(rel in that.data[val]){
		  if(that.data[val][rel].id == id){
		    that[val].push(that.data[val][rel]);
		  }
		}
	      }
	    });
	  }
	})
      }
    });
    setTimeout(function(){
      view.drawLabels();
      view.drawEdges();
    },200)
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
	$('.label').fadeTo(SPEED, 0);
	setTimeout(function(){
	  that.idToSelection(sid);
	},SPEED);
    });
    $(window).resize(function (e){
      that.sections = that.setSections();
      var newh = that.sections[0][1] - HEADERH;
      S.clear();
      S.attr({
	width: $(window).width(), 
	height: newh
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
	  if(view.selected[0].type != 1){
	    $('#1_' + pid[1].substr(1)).addClass('connected');
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
	    if(vi.id != j){
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
    $('#labels').on("mouseleave", ".hovered", function(e){
      $(this).removeClass('hovered');
      $('.label').removeClass('connected');
      S.selectAll('path').attr({opacity: 0.2, strokeDasharray: "0"});
    });
    $('#labels').on("mouseup", ".hovered", function(e){
      S.clear();
      var to = null;
      lid = $(this).attr('id');
      clearTimeout(to);
      setTimeout(function(){
	to = that.idToSelection(lid);
      }, SPEED/5);
    })
  }
  this.idToSelection = function(id){
    var that = this;
    var splitID = [];
    if(id.indexOf('_') == 1){
      splitID = id.split('_');
    }
//     if(splitID[0] === '0'){
//       that.selection[0][0] = 'author';
//     }else if(splitID[0] === '1'){
//       that.selection[0][0] = 'publication';
//     }else if(splitID[0] === '2'){
//       that.selection[0][0] = 'keyword';
//     }
    that.selection[0][0] = splitID[0];
    that.selection[0][1] = splitID[1];
    $.address.value(id);
    //window.location.search='?'+ view.selection[0][0] + '=' + view.selection[0][1];
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
      var lastpub = that.publications[i-1];
      var sel = '';
      if(pub.id == that.selected[0].id && pub.type == that.selected[0].type){
	sel = ' selected';
      }
      var maxpubs = 10;
      var iid = '#'+ pub.type + '_' + pub.id;
      var maxwidth = that.sections[1][0] - that.sections[0][0];
      var hremaining = that.sections[0][1] - lastpos.top - HEADERH + lasth;
      var pos = [];
      if(i < maxpubs && hremaining >= 150){
	if(i > 0){
	  pos = that.getPos(pub.type, i, lastpub);
	}else{
	  pos = that.getPos(pub.type, i, 0);
	}
	$('#labels').append('<div id="'+pub.type+'_'+pub.id+'" class="label pub' + sel +'" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;max-width:'+maxwidth+'px;"><span style="">'+pub.title+' ('+pub.year+')</span></div>');
	var w = $(iid).width();
	var h = $(iid).height();
	pos[1][0] = pos[0][0] + w + 12;
	pos[1][1] = pos[0][1] + h + 10;
	that.publications[i].p = pos;
	that.publications[i].active = true;
      }if(that.publications[i].active){
	lastpos = $(iid).offset();
	lasth = $(iid).height();
      }else{
	lastpos = that.sections[0][1];
	lasth = 0;
      }
    };
    for(i=0; i < that.authors.length; i++){
      var a = that.authors[i];
      var sel = '';
      if(a.id == that.selected[0].id && a.type == that.selected[0].type){
	sel = ' selected';
      }
      var pos = that.getPos(a.type, i, a);
      var iid = '#'+ a.type + '_' + a.id;
      if(pos[0][1] !== false){
	$('#labels').append('<div id="'+a.type+'_'+a.id+'" class="label author'+ sel +'" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;"><span>'+a.name+'</span></div>');
	var w = $(iid).width();
	var h = $(iid).height();
	pos[1][0] = pos[0][0] + w + 10;
	pos[1][1] = pos[0][1] + h + 10;
	that.authors[i].p = pos;
	that.authors[i].active = true;
      }
    };
    for(i=0; i < that.keywords.length; i++){
      var k = that.keywords[i];
      var sel = '';
      if(k.id == that.selected[0].id && k.type == that.selected[0].type){
	sel = ' selected';
      }
      var pos = that.getPos(k.type, i, k);
      var iid = '#'+ k.type + '_' + k.id;
      if(pos[0][1] !== false){
	if(that.sections[0][0] > SIDEMINWIDTH){
	  $('#labels').append('<div id="'+k.type+'_'+k.id+'" class="label keyword'+ sel +'" style="right:'+(OUTERMARGIN + BORDERS)+'px;top:'+pos[0][1]+'px;"><span>'+k.title+'</span></div>');
	  var w = $(iid).width();
	  var h = $(iid).height();
	  pos[0][0] = pos[1][0] - w - 10;
	}else{
	  $('#labels').append('<div id="'+k.type+'_'+k.id+'" class="label keyword'+ sel +'" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;"><span>'+k.title+'</span></div>');
	  var w = $(iid).width();
	  var h = $(iid).height();
	  pos[1][0] = pos[0][0] + w + 10;
	}
	pos[1][1] = pos[0][1] + h + 10;
	that.keywords[i].p = pos;
	that.keywords[i].active = true;
      }
    };
    $('.label').fadeTo(SPEED, 1);
  }
  this.drawEdges = function(){
    var that = this;
    var stroke = '#3377CC';
    $.each(that.authors, function(k, a){
      if(a.publications && a.type + '_' + a.id != that.selected[0].type + '_' + that.selected[0].id){
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
      if(a.publications && a.type + '_' + a.id != that.selected[0].type + '_' + that.selected[0].id){
	$.each(a.publications, function(kp, vp){
	  $.each(that.publications, function(gk, gv){
	    if(kp == gv.id && gv.active){
	      var edgeID = 'k'+a.id+'Xp'+gv.id;
	      var mya = ((a.p[0][1] + a.p[1][1]) / 2) - HEADERH;
	      var myp = ((gv.p[0][1] + gv.p[1][1]) / 2) - HEADERH;
	      var rmid = that.sections[1][0] + 6;
	      // view.edges[0].push(edge);
	      if(that.sections[0][0] > SIDEMINWIDTH){
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
      if(item != 0){
	var lid = '#'+ type + '_' + item.id;
	var ppos = $(lid).position();
	var ph = $(lid).height();
	var pw = $(lid).width();
	if(space >= ph){
	  p[0][1] = space*no + (space/2);
	}else{
	  p[0][1] = item.p[1][1] + BORDERS;
	}
      }else{
	if(space*no + (space/2) >= HEADERH){
	  p[0][1] = space*no + (space/2);
	}else{
	  p[0][1] = HEADERH;
	}
      }
    }
    else{
      if(item.type + '_' + item.id != that.selected[0].type + '_' + that.selected[0].id){
	var i = 0;
	if(item.type == 0 || that.sections[0][0] == SIDEMINWIDTH){
	  $.each(that.authors, function(ak, av){
	    
	  });
	  p[0][0] = OUTERMARGIN + BORDERS;
	}else if(item.type == 2 && that.sections[0][0] > SIDEMINWIDTH){
	  p[1][0] = that.sections[2][0] - OUTERMARGIN - BORDERS;
	}
	p[0][1] = 0;
	$.each(item.publications, function(ik,iv){
	  $.each(that.publications, function(pk,pv){
	    if(ik == pv.id && pv.active){
	      var pid = '#'+ 1 + '_' + ik;
	      var ppos = $(pid).offset();
	      var ph = $(pid).height();
	      var ypos = (2*ppos.top + ph)/2 - that.fontsize/2;
		p[0][1] += ypos;
	      i++;
	    }
	  })
	});
	if(i > 0){
	  p[0][1] /= i;
	  if(p[0][1] <= that.sections[0][1]/2){
	    p[0][1] += 60;
	  }else{
	    p[0][1] -= 60;
	  }
	  var ol = '';
	  if(item.type == 0){
	    oa = $('.label.author');
	  }else if(item.type == 2){
	    if(that.sections[0][0] > SIDEMINWIDTH){
	      oa = $('.label.keyword');
	    }else{
	      oa = $('.label').not('.pub');
	    }
	  }
	  $.each(oa, function(k,v){
	    var t = parseInt($(this).css('top'), 10);
	    var l = $(this).css('left');
	    var w = $(this).width();
	    var minoverlap = p[0][1] - FONTMAX - BORDERS;
	    var maxoverlap = p[0][1] + FONTMAX + BORDERS;
	    if(t >= minoverlap && t <= maxoverlap){
	      if(item.type == 2 && that.sections[0][0] > SIDEMINWIDTH){
		p[0][1] += 2*FONTMAX + BORDERS;
	      }else if(item.type == 2 && that.sections[0][0] == SIDEMINWIDTH){
		p[0][1] -= 2*FONTMAX + BORDERS;
	      }else{
		p[0][1] += 2*FONTMAX + BORDERS;
	      }
	     // p[0][1] += FONTMAX + BORDERS;
	    }
	  });
	}else{
	  p[0][1] = false;
	}
      }else{
	if(item.type == 0){
	  p[0][0] = OUTERMARGIN + BORDERS;
	  p[0][1] = HEADERH + BORDERS;
	}else{
	  p[0][0] = that.sections[2][0] - MAXSIDELABELWIDTH - OUTERMARGIN - BORDERS;
	  p[0][1] = HEADERH + BORDERS;
	}	
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
