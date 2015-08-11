var SPEED = 500;
var FONTMIN = 10;
var FONTMAX = 20;
var MIDMINWIDTH = 200;
var SIDEMINWIDTH = 200;
var HEADERH = 40;
var SEARCHPH = "search!";
var TYPES = ['authors', 'publications', 'keywords'];

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
	for(a in view.data[sel.type]){
	  if(view.data[sel.type][a].id == sel.value){
	    var s = view.data[sel.type][a];
	    s.selected = 1;
	    that[sel.type].push(s);
	    $.each(TYPES, function(key, val){
	      for(id in s[val]){
		for(rel in view.data[val]){
		  if(view.data[val][rel].id == id){
		    that[val].push(view.data[val][rel]);
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
    var draw = null;
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
	that.idToSelection(sid);
    });
    $(window).resize(function (e){
      view.sections = that.setSections();
      var noh = view.sections[0][1] - HEADERH;
      S.clear();
      S.attr({
	width: that.width, 
	height: noh
      });
      clearTimeout(draw);
      draw = setTimeout(function(){
	that.drawLabels();
	setTimeout(function(){
	  that.drawEdges();
	}, SPEED);
      }, SPEED);
    })
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
    $.each(view.data.authors, function(k, author){
      if(author.fullname.indexOf(term) >=0){
	if(sugg.length <= 15){
	  sugg.push(author);
	}
      }
    });
    $.each(view.data.publications, function(k, pub){
      if(pub.title.indexOf(term) >=0){
	if(sugg.length <= 15){
	  sugg.push(pub);
	}
      }
    });
    $.each(view.data.keywords, function(k, keyw){
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
    $('.label').remove();
    for(i=0; i < view.publications.length; i++){
      var pub = view.publications[i];
      var maxpubs = 10;
      var iid = '#'+ pub.type + '_' + pub.id;
      var lastpos = {top: HEADERH }
      var lasth = 0;
      var maxwidth = that.sections[1][0] - that.sections[0][0];
      var hleft = that.sections[0][1] - (lastpos.top + lasth);
      var pos = [];
      if(i < maxpubs && hleft >= 100){
	if(i > 0){
	  pos = that.getPos(pub.type, i, pub);
	}else{
	  pos = that.getPos(pub.type, i, 0);
	}
	$('#labels').append('<div id="'+pub.type+'_'+pub.id+'" class="label pub" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;max-width:'+maxwidth+'px;"><span>'+pub.title+'</span></div>');
	var w = $(iid).width();
	var h = $(iid).height();
	pos[1][0] = pos[0][0] + w;
	pos[1][1] = pos[0][1] + h;
	view.publications[i].p = pos;
	view.publications[i].active = true;
      }
      lastpos = $(iid).position();
      lasth = $(iid).height();
    };
    for(i=0; i < view.authors.length; i++){
      var a = view.authors[i];
      var pos = that.getPos(a.type, i, a);
      var iid = '#'+ a.type + '_' + a.id;
      if(pos[0][1] !== false){
	$('#labels').append('<div id="'+a.type+'_'+a.id+'" class="label author" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;"><span>'+a.name+'</span></div>');
	var w = $(iid).width();
	var h = $(iid).height();
	pos[1][0] = pos[0][0] + w;
	pos[1][1] = pos[0][1] + h;
	view.authors[i].p = pos;
	view.authors[i].active = true;
      }
    };
    console.log(view.authors);
    for(i=0; i < view.keywords.length; i++){
      var k = view.keywords[i];
      var pos = that.getPos(k.type, i, k);
      var iid = '#'+ k.type + '_' + k.id;
      if(pos[0][1] !== false){
	$('#labels').append('<div id="'+k.type+'_'+k.id+'" class="label keyword" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;"><span>'+k.title+'</span></div>');
	var w = $(iid).width();
	var h = $(iid).height();
	pos[1][0] = pos[0][0] + w;
	pos[1][1] = pos[0][1] + h;
	view.keywords[i].p = pos;
	view.keywords[i].active = true;
      }
    };
  }
  this.drawEdges = function(){
    var that = this;
    $.each(view.authors, function(k, a){
      if(a.publications && !a.selected){
	$.each(a.publications, function(kp, vp){
	  $.each(view.publications, function(gk, gv){
	    if(kp == gv.id && gv.active){
	      console.log(a.p);
	      var mya = ((a.p[0][1] + a.p[1][1]) / 2) - HEADERH;
	      var myp = ((gv.p[0][1] + gv.p[1][1]) / 2) - HEADERH;
	      var cx = (a.p[1][0] + gv.p[0][0]) / 2;
	      
	      var path = 'M'+ a.p[1][0] + ',' + mya + ' C' + cx + ',' + mya + ' ' + cx + ',' + myp + ' ' + gv.p[0][0] + ',' + myp;
	      S.path(path).attr({stroke: "#ccc", strokeWidth: 1, fill: "none", opacity: 0, class: "path"});
	    }
	  });
	});
      }
    });
    $.each(view.keywords, function(k, a){
      if(a.publications && !a.selected){
	$.each(a.publications, function(kp, vp){
	  $.each(view.publications, function(gk, gv){
	    if(kp == gv.id && gv.active){
	      var mya = ((a.p[0][1] + a.p[1][1]) / 2) - HEADERH;
	      var myp = ((gv.p[0][1] + gv.p[1][1]) / 2) - HEADERH;
	      if(that.sections[0][0] > 200){
		var cx = (a.p[0][0] + gv.p[1][0]) / 2;
		var path = 'M'+ a.p[0][0] + ',' + mya + ' C' + cx + ',' + mya + ' ' + cx + ',' + myp + ' ' + gv.p[1][0] + ',' + myp;
	      }else{
		var cx = (a.p[1][0] + gv.p[0][0]) / 2;
		var path = 'M'+ a.p[1][0] + ',' + mya + ' C' + cx + ',' + mya + ' ' + cx + ',' + myp + ' ' + gv.p[0][0] + ',' + myp;
	      }
	      S.path(path).attr({stroke: "#ccc", strokeWidth: 1, fill: "none", opacity: 0, class: "path" });
	    }
	  });
	});
      }
    });
    S.selectAll('.path').animate({opacity: 1}, SPEED/2);
  }
  this.getPos = function(type, no, item){
    var that = this;
    var p = [[],[]];
    var space = that.sections[1][1] / view.publications.length;
    if(type == 1){
      p[0][0] = that.sections[0][0];
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
	  p[0][0] = 50;
	}else if(item.type == 2 && that.sections[0][0] > 200){
	  p[0][0] = that.sections[1][0] + 50;
	}
	p[0][1] = 0;
	$.each(item.publications, function(ik,iv){
	  $.each(view.publications, function(pk,pv){
	    if(ik == pv.id){
	      var pid = '#'+ 1 + '_' + ik;
	      var ppos = $(pid).offset();
	      var ph = $(pid).height();
	      p[0][1] += (2*ppos.top + ph)/2;
	      i++;
	    }
	  })
	});
	if(i > 0){
	  p[0][1] /= i;
	  var oa = '';
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
	      p[0][0] += w + 20;
	      p[0][1] += 20;
	    }
	  });
	}else{
	  p[0][1] = false;
	}
      }else{
	p[0][0] = 20;
	p[0][1] = 20;
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