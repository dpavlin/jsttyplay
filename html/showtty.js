// showtty.js - a building block for viewing tty animations
// Copyright 2008 Jack Christopher Kastorff
(function(){

var htmlns = "http://www.w3.org/1999/xhtml";

var repeatString = function (str, rep) {
    var outstr = '';
    for (var i = 0; i < rep; i++) {
        outstr += str;
    }
    return outstr;
};

var makeTable = function (width, height) {
    var table = document.createElementNS(htmlns, "div");
    var arr = [];
    for (var j = 1; j <= height; j++) {
        var row = document.createElementNS(htmlns, "div");
        var arrrow = [];
        row.style.fontFamily = '"ProFont", "Luxi Mono", "Monaco", "Courier", "Courier new", monospace';
        for (var i = 1; i <= width; i++) {
            var charelem = document.createElementNS(htmlns, "pre");
            charelem.style.width = '1em';
            charelem.style.height = '1em';
            charelem.style.backgroundColor = '#000';
            charelem.style.color = '#FFF';
            charelem.style.display = 'inline';
            charelem.style.fontWeight = 'normal';
            charelem.style.textDecoration = 'none';
            charelem.appendChild(document.createTextNode(" "));
            row.appendChild(charelem);
            arrrow.push(charelem);
        }
        table.appendChild(row);
        arr.push(arrrow);
    }
    return { "arr": arr, "elem": table };
};

var setTextRow = function (tb, r, index) {
    for (var i = 0; i < tb.arr[index].length; i++) {
        var e = tb.arr[index][i];
        e.firstChild.replaceData(0, 1, r.charAt(i))
    }
};

var setBoldRow = function (tb, r, index) {
    for (var i = 0; i < tb.arr[index].length; i++) {
        var e = tb.arr[index][i];
        if ( r.charAt(i) == 0 ) {
            e.style.fontWeight = 'normal';
        } else {
            e.style.fontWeight = 'bold';
        }
    }
};

var setUnderlineRow = function (tb, r, index) {
    for (var i = 0; i < tb.arr[index].length; i++) {
        var e = tb.arr[index][i];
        if ( r.charAt(i) == 0 ) {
            e.style.textDecoration = 'none';
        } else {
            e.style.textDecoration = 'underline';
        }
    }
};

var clut = { 0: "#000", 1: "#D00", 2: "#0D0", 3: "#DD0", 4: "#00D", 5: "#D0D", 6: "#0DD", 7: "#DDD" };

var setFcolorRow = function (tb, r, index) {
    for (var i = 0; i < tb.arr[index].length; i++) {
        tb.arr[index][i].style.color = clut[r.charAt(i)];
    }
};

var setBcolorRow = function (tb, r, index) {
    for (var i = 0; i < tb.arr[index].length; i++) {
        tb.arr[index][i].style.backgroundColor = clut[r.charAt(i)];
    }
};

var loadIFrame = function (tb, rowcaches, fr, width, height) {
    var d = uncompressIFrameBlock(fr.d, width);
    for (var i = 0; i < d.length; i++) {
        setTextRow(tb, d[i], i);
        rowcaches.d[i] = d[i];
    }
    var B = uncompressIFrameBlock(fr.B, width);
    for (var i = 0; i < B.length; i++) {
        setBoldRow(tb, B[i], i);
        rowcaches.B[i] = B[i];
    }
    var U = uncompressIFrameBlock(fr.U, width);
    for (var i = 0; i < U.length; i++) {
        setUnderlineRow(tb, U[i], i);
        rowcaches.U[i] = U[i];
    }
    var f = uncompressIFrameBlock(fr.f, width);
    for (var i = 0; i < f.length; i++) {
        setFcolorRow(tb, f[i], i);
        rowcaches.f[i] = f[i];
    }
    var b = uncompressIFrameBlock(fr.b, width);
    for (var i = 0; i < b.length; i++) {
        setBcolorRow(tb, b[i], i);
        rowcaches.b[i] = b[i];
    }
};

var uncompressIFrameBlock = function (d,width) {
    var uncomp = [];
    var last = null;
    for (var i = 0; i < d.length; i++) {
        var uncomprow = null;
        if ( typeof d[i] == 'array' || typeof d[i] == 'object' ) {
            if ( d[i][0] == "r" ) {
                uncomprow = d[i][1];
            } else if ( d[i][0] == "a" ) {
                uncomprow = repeatString(d[i][1], width);
            } else {
                throw new Error ("bad iframe data: subarray is not valid");
            }
        } else if ( typeof d[i] == 'string' && d[i] == 'd' ) {
            uncomprow = last;
        } else {
            throw new Error ("bad iframe data: unknown " + (typeof d[i]) + " in array");
        }
        uncomp.push(uncomprow);
        last = uncomprow;
    }
    return uncomp;
};

var loadPFrame = function (table, rowcaches, fr, width, height) {
    if ( fr.d ) {
        diffPushGeneric(table, annotatedPFrameBlock(fr.d, width), rowcaches.d, setTextRow);
    }
    if ( fr.B )  {
        diffPushGeneric(table, annotatedPFrameBlock(fr.B, width), rowcaches.B, setBoldRow);
    }
    if ( fr.U ) {
        diffPushGeneric(table, annotatedPFrameBlock(fr.U, width), rowcaches.U, setUnderlineRow);
    }
    if ( fr.f ) {
        diffPushGeneric(table, annotatedPFrameBlock(fr.f, width), rowcaches.f, setFcolorRow);
    }
    if ( fr.b ) {
        diffPushGeneric(table, annotatedPFrameBlock(fr.b, width), rowcaches.b, setBcolorRow);
    }
};

var diffPushGeneric = function (table, d, rowcache, set) {
    // convert everything to line operations
    var lines = [];
    for (var i = 0; i < d.length; i++) {
        var e = d[i];
        if ( e[0] == "cp" ) {
            lines.push([e[2], rowcache[e[1]]]);
        } else if ( e[0] == 'char' ) {
            var r = e[1];
            var v = rowcache[r];
            var da = v.slice(0, e[2]) + e[3] + v.slice(e[2]+1);
            lines.push([r, da]);
        } else if ( e[0] == 'chunk' ) {
            var r = e[1];
            var v = rowcache[r];
            var da = v.slice(0, e[2]) + e[4] + v.slice(e[3]+1);
            lines.push([r, da]);
        } else if ( e[0] == 'line' ) {
            lines.push([e[1], e[2]]);
        } else {
            throw new Error ("unknown p-frame item type " + e[0] + ", len " + e.length);
        }
    }

    // then set the lines
    for (var i = 0; i < lines.length; i++) {
        set(table, lines[i][1], lines[i][0]);
        rowcache[lines[i][0]] = lines[i][1];
    }
};

var annotatedPFrameBlock = function (frame, width) {
    var ann = [];
    for (var i = 0; i < frame.length; i++) {
        var e = frame[i];
        if ( e[0] == 'cp' ) {
            ann.push(e);
        } else if ( e.length == 2 ) {
            // raw line
            if ( typeof e[1] == 'string' ) {
                ann.push(['line', e[0], e[1]]);
            } else if ( e[1][0] == "a" ) {
                ann.push(['line', e[0], repeatString(e[1][1], width)]);
            } else {
                throw new Error ("p-frame corrupted: invalid 2-len");
            }
        } else if ( e.length == 3 ) {
            // char
            ann.push(['char', e[0], e[1], e[2]]);
        } else if ( e.length == 4 ) {
            // chunk
            if ( typeof e[3] == 'string' ) {
                ann.push(['chunk', e[0], e[1], e[2], e[3]]);
            } else if ( e[3][0] == 'a' ) {
                ann.push(['chunk', e[0], e[1], e[2], repeatString(e[3][1], e[2]-e[1]+1)]);
            } else {
                throw new Error ("p-frame corrupted: invalid 4-len");
            }
        } else {
            throw new Error ("p-frame corrupted: no such thing as a " + e.length + "-len");
        }
    }
    return ann;
};

var handleCursor = function (table, bgcache, curpos, dx, dy) {
    if ( typeof dx == 'number' || typeof dy == 'number' ) {
        // make sure the old cursor position has been overwritten
        setBcolorRow(table, bgcache[curpos[1]-1], curpos[1]-1);
        if ( typeof dx == 'number' ) {
            curpos[0] = dx;
        }
        if ( typeof dy == 'number' ) {
            curpos[1] = dy;
        }
    }

    // draw the cursor
    table.arr[curpos[1]-1][curpos[0]-1].style.backgroundColor = '#FFF';
};

var animateNextFrame = function (holder) { with (holder) {
    var fr = timeline[nextframe];
    if ( fr.i ) {
        loadIFrame(table, rowcaches, fr, width, height);
    } else {
        loadPFrame(table, rowcaches, fr, width, height);
    }
    handleCursor(table, rowcaches.b, curpos, fr.x, fr.y);
    nextframe++;
    if ( timeline.length > nextframe ) {
        var wait = timeline[nextframe].t - timeline[nextframe-1].t;
        setTimeout(function(){animateNextFrame(holder);}, wait*1000);
    }
}};

var makeCache = function (ch, wid, hei) {
    var c = [];
    for (var y = 0; y < hei; y++) {
        c.push( repeatString(ch, wid) );
    }
    return c;
};

showTTY = function (elem, data) {
    while ( elem.firstChild ) {
        elem.removeChild( elem.firstChild );
    }
    
    var width = data.width;
    var height = data.height;
    var timeline = data.timeline;

    var table = makeTable(width, height);
    elem.appendChild(table.elem);

    var holder = {
        'width': width,
        'height': height,
        'timeline': timeline,
        'table': table,
        'nextframe': 0,
        'time': 0,
        'rowcaches': {
            'd': makeCache(" ", width, height),
            'f': makeCache("7", width, height),
            'b': makeCache("0", width, height),
            'B': makeCache("0", width, height),
            'U': makeCache("0", width, height)
        },
        'curpos': [1,1]
      };

    animateNextFrame(holder);
};


}());