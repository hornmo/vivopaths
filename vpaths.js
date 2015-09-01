var SPEED = 500;
var FONTMIN = 10;
var FONTMAX = 20;
var MIDMINWIDTH = 200;
var SIDEMINWIDTH = 300;
var HEADERH = 80;
var SEARCHPH = "search!";
var TYPES = { 0: "authors", 1: "publications", 2: "keywords" };
var BORDERS = 2;
var OPACFOCUS = 0.8;
var MAXSIDELABELWIDTH = 200;
var OUTERMARGIN = 50;
var COLORS = ["#3377CC","#77AA33","#CC7733"]

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
    this.authors = {};
    this.selected = [];
    this.publications = {};
    this.keywords = {};
    this.order = 'year';
    this.events();
    this.getData();
    this.pubSplit = {top: [], mid: [], bottom:[]};
    this.offsets = { top: [0,0], mid: [0,0], bottom: [0,0] };
    this.context = {visible: false, item: '' };
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
    jQuery.getJSON("test_data.json", function(r,s){
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
    if(that.selection.length){
      $.each(that.selection, function(k,v){
	  sel.push({
	    type: TYPES[v[0]],
	    value: v[1]
	  })
      });
      for(i=0;i<sel.length;i++){
	var obj = that.data[sel[i].type][sel[i].value];
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
		  if(iv.id === relID){
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
      that.orderPubs();
      setTimeout(function(){
	that.drawLabels();
	that.drawEdges();
      },200);
    }else{
      S.clear();
      $('.label').remove();
    }
  };
  this.events = function(){
    var that = this;
    var rtime;
    var timeout = false;
    var delta = 200;
    $('#search input').focus(function(event){
      $(this).attr('placeholder', '');
      $('#search input').keyup(function(event){
	if(event.keyCode == 40) { 
	  event.preventDefault()	  
	};
      })
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
	  that.idToSelection(sid, 1);
	},SPEED);
    });
    $(window).resize(function (e){
      that.sections = that.setSections();
      var newh = that.sections[0][1] - HEADERH;
      S.clear();
      $('#canvas').css('height', newh);
      S.attr({
	width: $(window).width(), 
	height: newh
      });
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
    $.address.change(function(){ that.getPars(); });
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
	if(that.selection[0][0] != 1){
	  $(this).append('<span class="compare" title="Compare"><i class="fa fa-plus"></i></span>');
	}
	if(typeN == 2 && that.sections[0][0] > SIDEMINWIDTH && that.selection[0][0] != 1){
	  var compareWidth = $(this).children('.compare').width();
	  $(this).css("right", function(i, v){ n = parseInt(v) - 20; return n + "px"});
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
	    console.log(vi.id + ' - ' + j);
	    console.log(vi.id === j);
	    if(vi.id !== j){
	      var ceid = vi.id.split('X');
	      var elid = '#' + typeN + '_' + ceid[0].substr(1);
	      console.log(elid);
	      S.select('[id='+vi.id+']').attr({opacity: OPACFOCUS, strokeDasharray: "5 5" });
	      $(elid).addClass('connected');
	    };
	  })
	});
      }
      S.selectAll(eid).attr({opacity: OPACFOCUS});
    });
    $('#labels').on("mouseleave", ".hovered", function(e){
      var id = $(this).attr('id');
      $(this).removeClass('hovered');
      $(this).children('.compare').remove();
      if(id.substr(0,1) == 2 && that.sections[0][0] > SIDEMINWIDTH && that.selection[0][0] != 1){
	$(this).css("right", function(i, v){ n = parseInt(v) + 20; return n + "px"})
      }
      $('.label').removeClass('connected');
      S.selectAll('path').attr({opacity: 0.2, strokeDasharray: "0"});
    });
    $('#labels').on("mouseup", ".label-text:not(.selected)", function(e){
      S.clear();
      var to = null;
      lid = $(this).parent().attr('id');
      clearTimeout(to);
      setTimeout(function(){
	to = that.idToSelection(lid, 1);
      }, SPEED/5);
    })
    $('#labels').on("mouseup", ".compare", function(e){
      S.clear();
      var to = null;
      lid = $(this).parent().attr('id');
      clearTimeout(to);
      setTimeout(function(){
	to = that.idToSelection(lid, 2);
      }, SPEED/5);
    })
    $('#labels').on("mouseup", ".remove", function(e){
      S.clear();
      var to = null;
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
	  $('#context').append('<span id="context-head">'+selItem.fullname+'</span>');
	  if(selItem.photo){
	    $('#context').append('<span id="context-right"><img style="width:80px" src="'+selItem.photo+'" /></span>');
	  }
	  $('#context').append('<p id="context-links"><a href="'+selItem.uri+'">Zum VIVO-Profil</a></p>');
	}else if(selItem.type === 1){
	  $('#context').append('<span id="context-head">'+selItem.title+'</span>');
	  $('#context').append('<p id="context-links"><a href="'+selItem.uri+'">Nachweis in VIVO</a></p>');
	}else if(selItem.type === 2){
	  $('#context').append('<span id="context-head">'+selItem.title+'</span>');
	  $('#context').append('<p id="context-links"><a href="'+selItem.uri+'">Nachweis in VIVO</a></p>');
	}
	if(selItem.p[0][1] >= HEADERH + 200 ){
	  styles.bottom = (that.sections[0][1] - selItem.p[0][1] + 10) + 'px';
	}else{
	  styles.top = (selItem.p[1][1]) + 'px';
	}
	if(selItem.type == 2 && that.sections[0][0] > SIDEMINWIDTH){
	  console.log('text');
	  styles.right = OUTERMARGIN + 'px';
	}else{
	  styles.left = selItem.p[0][0] + 'px';
	}
	styles.border = '2px solid' + COLORS[splitID[0]];
	styles.width = '350px';
	$('#context').css(styles);
	$('#context').fadeTo(SPEED/5, 1);
      }
    })
    $(document).mouseup(function(e){
      console.log($(e.target).attr('class'));
      var subject = $("#context");
      if(that.context.visible == true && $(e.target).parent().attr('class') != 'label-icon' && e.target.id != subject.attr('id') && !subject.has(e.target).length){
	that.context.visible = false;
	$('#context').children().remove();
	$('#context').css({top: "", bottom:"", left: "", border: "", height: "", width: ""});
	$('#context').fadeTo(SPEED/5, 0);
      }
    })
  }
  this.idToSelection = function(id, mode){
    var that = this;
    var splitID = [];
    if(id.indexOf('_') === 1){
      splitID = id.split('_');
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
	that.selection = [];
	$.address.value('');
      }
    }else if(mode === 1){
      if(that.selection){
	var l = that.selection.length;
	that.selection.splice(0, l);
      }
      that.selection[0] = splitID;
      $.address.value(id);
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
	if(sugg.length <= 15){
	  sugg.push(this);
	}
      }
    });
    $.each(that.data.publications, function(k, pub){
      if(this.title.toLowerCase().indexOf(term.toLowerCase()) >=0){
	if(sugg.length <= 15){
	  sugg.push(this);
	}
      }
    });
    $.each(that.data.keywords, function(k, keyw){
      if(this.title.toLowerCase().indexOf(term.toLowerCase()) >=0){
	if(sugg.length <= 15){
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
  this.getOffsets = function(){
    var that = this;
    var sel = that.selected.length;
    var selHeight = sel*2*FONTMAX;
    var pubsTotal = that.pubSplit.top.length + that.pubSplit.mid.length + that.pubSplit.bottom.length;
    var maxpubs = Math.floor((that.sections[0][1] - HEADERH - selHeight)/(1.8*FONTMAX));
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
	console.log(maxpubs/3);
	console.log(withinLimits);
	if(this.length > Math.floor(maxpubs/3)){
	  if(withinLimits[0] == 0){
	    that.offsets[key][1] = Math.floor(maxpubs/3);
	  }else if(withinLimits[0] == 1){
	    that.offsets[key][1] = Math.floor((maxpubs - withinLimits[1])/2)
	  }else if(withinLimits[0] == 2){
	    that.offsets[key][1] = (maxpubs - withinLimits[1] - 1)
	  }
	}else{
	  that.offsets[key][1] = this.length-1;
	}
      })
    }else{
      $.each(that.offsets, function(key, array){
	this[1] = that.pubSplit[key].length-1;
      })
    }
  }
  this.drawLabels = function(){
    var that = this;
    var combID = '';
    var remElem = '<span class="remove" title="Remove"><i class="fa fa-times"></i></span>';
    var rem = '';
    var sel = '';
    $('.label').remove();
    that.getOffsets();
    $.each(that.pubSplit, function(key, pubs){
      for(i=0;i<pubs.length;i++){
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
	  $('#labels').append('<div id="'+pub.type+'_'+pub.id+'" class="label pub' + sel +'" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;max-width:'+maxwidth+'px;"><span title="Details" class="label-icon"><i class="fa fa-file"></i></span><span class="label-text" title="'+pub.title+'">'+shortt+' ('+pub.year+')</span>'+rem+'</div>');
	  var w = $(iid).width();
	  var h = $(iid).height();
	  pos[1][0] = pos[0][0] + w + 12;
	  pos[1][1] = pos[0][1] + h + 10;
	  pub.p = pos;
	  pub.active = true;
	}else{
	  delete pub.active;
	  pub.active = false;
	}
      }
    });
    
    for(i=0; i < that.authors.length; i++){
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
	$('#labels').append('<div id="'+a.type+'_'+a.id+'" class="label author'+ sel +'" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;"><span title="Details" class="label-icon"><i class="fa fa-user"></i></span><span class="label-text">'+a.name+'</span>'+rem+'</div>');
	var w = $(iid).width();
	var h = $(iid).height();
	pos[1][0] = pos[0][0] + w + 10;
	pos[1][1] = pos[0][1] + h + 10;
	a.p = pos;
	a.active = true;
      }
    };
    for(i=0; i < that.keywords.length; i++){
      var k = that.keywords[i];
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
      var pos = that.getPos(k, i);
      var iid = '#'+ k.type + '_' + k.id;
      if(pos[0][1] !== false){
	if(that.sections[0][0] > SIDEMINWIDTH && !k.selected){
	  $('#labels').append('<div id="'+k.type+'_'+k.id+'" class="label keyword'+ sel +'" style="right:'+pos[1][0]+'px;top:'+pos[0][1]+'px;"><span title="Details" class="label-icon"><i class="fa fa-tag"></i></span><span class="label-text">'+k.title+'</span>'+rem+'</div>');
	  var w = $(iid).width();
	  var h = $(iid).height();
	  pos[1][0] = that.sections[2][0] - pos[1][0];
	  pos[0][0] = pos[1][0] - w - 10;
	}else{
	  $('#labels').append('<div id="'+k.type+'_'+k.id+'" class="label keyword'+ sel +'" style="left:'+pos[0][0]+'px;top:'+pos[0][1]+'px;"><span title="Details" class="label-icon"><i class="fa fa-tag"></i></span><span class="label-text">'+k.title+'</span>'+rem+'</div>');
	  var w = $(iid).width();
	  var h = $(iid).height();
	  pos[1][0] = pos[0][0] + w + 10;
	}
	pos[1][1] = pos[0][1] + h + 10;
	k.p = pos;
	k.active = true;
      }
    };
    $('.label').fadeTo(SPEED, 1);
  }
  this.drawEdges = function(){
    var that = this;
    var stroke = '#3377CC';
    $.each(that.authors, function(k, a){
      if(a.publications && !a.selected && a.active === true){
	$.each(a.publications, function(pubID){
	  $.each(that.pubSplit, function(sector, pubs){
	    $.each(pubs, function(gk, gv){
	      if(pubID == gv.id && gv.active){
		var edgeID = 'a'+a.id+'Xp'+gv.id;
		var mya = ((a.p[0][1] + a.p[1][1]) / 2) - HEADERH;
		var myp = ((gv.p[0][1] + gv.p[1][1]) / 2) - HEADERH;
		var cx = (a.p[1][0] + gv.p[0][0]) / 2;
		var path = 'M'+ a.p[1][0] + ',' + mya + ' C' + cx + ',' + mya + ' ' + cx + ',' + myp + ' ' + gv.p[0][0] + ',' + myp;
		S.path(path).attr({stroke: stroke, strokeWidth: 1, fill: "none", opacity: 0, class: "path", id: edgeID });
	      }
	    });
	  });
	});
      }
    });
    $.each(that.keywords, function(k, a){
      var stroke = '#CC7733';
      if(a.publications && !a.selected && a.active === true){
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
		S.path(path).attr({ stroke: stroke, strokeWidth: 1, fill: "none", opacity: 0, class: "path", id: edgeID });
	      }
	    });
	  });
	});
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
    var maxpubs = Math.floor((that.sections[0][1] - HEADERH - selHeight)/(1.7*FONTMAX));
    var totalPubs = that.pubSplit.top.length + that.pubSplit.mid.length + that.pubSplit.bottom.length;
    if(totalPubs > 0 && totalPubs <= maxpubs){
      space = (that.sections[1][1] - HEADERH - selHeight) / (totalPubs);
    }else{
      space = (that.sections[1][1] - HEADERH - selHeight) / (maxpubs +1);
    }
    if(item.type == 1){
      p[0][0] = that.sections[0][0] + BORDERS;
      if(that.selected.length == 2){
	if(sector == 'top'){
	  p[0][1] = HEADERH + space*no + (space/3);
	}else if(sector == 'mid'){
	  p[0][1] = HEADERH + space*(no + that.offsets.top[1]) + 0.85*selHeight + (space/3);
	}else if(sector == 'bottom'){
	  p[0][1] = HEADERH + space*(no + that.offsets.top[1] + that.offsets.mid[1]) + 1.7*selHeight + (space/3);
	}
	
      }else if(that.selected.length == 1){
	p[0][1] = HEADERH + space*no + 0.85*selHeight + (space/3);
      }
    }
    else{
      if(!item.selected){
	var i = 0;
	if(item.type == 0 || that.sections[0][0] == SIDEMINWIDTH){
	  $.each(that.authors, function(ak, av){
	    
	  });
	  p[0][0] = OUTERMARGIN + BORDERS;
	}else if(item.type == 2 && that.sections[0][0] > SIDEMINWIDTH){
	  p[1][0] = OUTERMARGIN + BORDERS;
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
	  var ol = '';
	  var changeW = 0;
	  var minoverlap = p[0][1] - FONTMAX - BORDERS;
	  var maxoverlap = p[0][1] + FONTMAX + BORDERS + 10;
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
	    var h = $(this).height();

	    if(t + h >= minoverlap && t <= maxoverlap){
	      var olmin = (t+h) - p[0][1];
	      var olmax = t - (p[0][1] + h);
	      if(olmin >= olmax){
		p[0][1] += olmin + BORDERS + 8;
	      }else{
		p[0][1] -= olmax + BORDERS + 8;
	      }
	    }
	    if(p[0][1] <= HEADERH){
	      p[0][1] = HEADERH;
	    }else if(p[0][1] >= that.sections[0][1] - FONTMAX - BORDERS){
	      p[0][1] = that.sections[0][1] - FONTMAX - BORDERS;
	    }
	  });
	  $.each(oa, function(k,v){   
	    var t = parseInt($(this).css('top'), 10);
	    var h = $(this).height();
	    var w = $(this).width();
	    var xpos = '';
	    if(item.type == 0 || that.sections[0][0] == SIDEMINWIDTH){
	      xpos = parseInt($(this).css('left'),10);
	    }else if(item.type == 2 && that.sections[0][0] > SIDEMINWIDTH){
	      xpos = parseInt($(this).css('right'),10)
	    }
	    if(t + h >= minoverlap && t <= maxoverlap && xpos == OUTERMARGIN + BORDERS){
	      changeW = w;
	    }
	  });
	  if(changeW != 0){
	    if(item.type == 0 || that.sections[0][0] == SIDEMINWIDTH){
	      p[0][0] = OUTERMARGIN + BORDERS + changeW;
	    }else if(item.type == 2 && that.sections[0][0] > SIDEMINWIDTH){
	      p[1][0] = OUTERMARGIN + BORDERS + changeW;
	    }
	  }
	}else{
	  p[0][1] = false;
	}
      }else{
	p[0][0] = that.sections[0][0] + BORDERS;
	var pubsTop = that.pubSplit.top;
	var pubsMid = that.pubSplit.mid;
	var pubsBot = that.pubSplit.bottom;
	if(that.selected.length === 2){
	  var xTop = '';
	  if(item.selected == 1){
	    if(pubsTop.length && pubsMid.length){
	      p[0][1] = (pubsTop[that.offsets['top'][1]].p[1][1] + pubsMid[0].p[0][1])/2 - 0.8*FONTMAX;
	    }else if(!pubsTop.length){
	      p[0][1] = (HEADERH + pubsMid[0].p[0][1])/2 - 0.8*FONTMAX;
	    }else if(pubsTop.length && !pubsMid.length){
	      p[0][1] = (pubsTop[that.offsets['top'][1]].p[1][1] + pubsBot[0].p[0][1])/2 - 0.8*FONTMAX;
	    }
	  }else if(item.selected == 2){
	    if(pubsMid.length && pubsBot.length){
	      p[0][1] = (pubsMid[that.offsets['mid'][1]].p[1][1] + pubsBot[0].p[0][1])/2 - 0.8*FONTMAX;
	    }else if(!pubsMid.length){
	      p[0][1] = (pubsTop[that.offsets['top'][1]].p[1][1] + pubsBot[0].p[0][1])/2 - 0.8*FONTMAX;
	      p[0][0] = that.sections[0][0] + BORDERS + MAXSIDELABELWIDTH;
	    }else if(pubsMid.length && !pubsBot.length){
	      p[0][1] = (pubsMid[that.offsets['mid'][1]].p[1][1] + that.sections[1][1])/2 - 0.8*FONTMAX;
	    }
	  }
	}else if(that.selected.length === 1){
	  p[0][1] = (HEADERH + pubsTop[0].p[0][1])/2 - 0.8*FONTMAX + BORDERS;
	}
      }
      if(p[0][1] >= that.sections[0][1] - FONTMAX || p[0][1] <= HEADERH){
	p[0][1] = false;
      }
    }
    return p;
  }
  this.shortenLabel = function(type, label){
    function getTextWidth(text, font) {
	var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
	var context = canvas.getContext("2d");
	context.font = font;
	var metrics = context.measureText(text);
	return metrics.width;
    };
    function trimByPixel(str, width) {
      var spn = $('<span class="temp" style="visibility:hidden;font-size:15pt"></span>').text(str).appendTo('body');
      var txt = str;
      while (spn.width() > width) { txt = txt.slice(0, -1); spn.text(txt + "..."); }
      return txt;
    }
    var lwidth = getTextWidth(label, "15pt 'Generika Light'" );
    var slabel = '';
    var that =  this;
    var mwidth = that.sections[1][0] - that.sections[0][0];
    if(type === 1){
      if(lwidth >= mwidth*0.9){
	slabel = trimByPixel(label, mwidth*0.8);
	slabel += "...";
      }else{
	slabel = label;
      }
    }else{
      slabel = label;
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
