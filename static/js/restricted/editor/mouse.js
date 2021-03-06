/**
 * Rawscripts - Screenwriting Software
 * Copyright (C) Ritchie Wilson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


/**
 * Takes MouseDown Event, figures out what to do with it depending on
 * if that's in a menu, or other DOM things, or in the canvas.
 *
 * If the mouse down event is on the canvas, it moves pos and anch to
 * the same point.
 * 
 * @param {goog.events.BrowserEvent} e gives the mousedown event with
 * associated data
 */
function mouseDown(e){
    forceRepaint = true;
	// only do stuff if canvas is active
	// i.e. popups and dom sutff isn't being
	// interacted with
	if(typeToScript){
		// if a suggest box is open, quit this
		// function. the box has it's own logic
		if(goog.dom.getElement('suggestBox')!=null){
			return;
		}
		else if(goog.dom.getElement('context_menu')!=null){
			// if theres a DOM context menu, take it's action
			// it it's being clicked. If not, just remove it
			if(e.target.className=="contextUnit"){
				changeFormat(e.target.id.replace("cm",""));
			}
			goog.dom.getElement('context_menu').parentNode.removeChild(goog.dom.getElement('context_menu'));
		}
	    else{
			// ok, so the user is interacting with a drawing
			// ont he canvas. 
			
			if(e.clientX<editorWidth-100 && e.clientY>60 && e.target.id=="canvasText"){
				// user is clicking on text, put the anchor there
				mouseDownBool=true;
				var a=mousePosition(e);
				anch.row=pos.row=a.row;
				anch.col=pos.col=a.col;
				lineFormatGuiUpdate();
				fillInfoBar();
			}
			// figure out where the fake scroll bar is
			var cp={x:e.clientX, y:e.clientY-headerHeight-8}; //canvas posititon of 
			if(e.clientX<editorWidth && e.clientX>scrollBarPos.x && cp.y>scrollBarPos.y && cp.y<scrollBarPos.y+scrollBarPos.h){
				scrollBarBool=true;
			}
		}
		selection();
	}
}

/**
 * Takes MouseUp Event, figures out what to do with it. Changes globar
 * varialbes then changes dom stuff.
 * 
 * @param {goog.events.BrowserEvent} e gives the mouseup event with
 * associated data
 */
function mouseUp(e){
    forceRepaint = true;
	updateMouseDrag=false; // no longer draggin
	// if there is a character or scene 
	// suggestion box, remove it
	if(goog.dom.getElement('suggestBox')!=null){
		goog.dom.removeNode(goog.dom.getElement('suggestBox'));
	}
	
	mouseDownBool=false;
	scrollBarBool=false;
	
	// update a bunch of GUI thigns
	fMenu.setVisible(false)
	eMenu.setVisible(false)
	vMenu.setVisible(false)
	sMenu.setVisible(false)
	var arr=["file",'edit','view','share'];
	for(i in arr){
		var d = goog.dom.getElement(arr[i]);
		d.style.backgroundColor='#A2BAE9';
        d.style.color='black';
	}
	lineFormatGuiUpdate();
	
	// if the focus is the canvas text, 
	// put focus back in hidden box
	if(typeToScript){
		selection();
	}
}

/**
 * Handle when the mouse moves. If the mouse button is down on the
 * scrollbar, handle the move by scrolling. If the mouse button is
 * down on text, this is a "drag" across text, so prep to find new
 * posistion.
 *
 * If the new mouse position is over a note drawn on canvas, change
 * the cursor, make it clickable.
 * 
 * @param {goog.events.BrowserEvent} e MouseMove event
 */
function mouseMove(e){
    forceRepaint = forceRepaint || scrollBarBool || mouseDownBool;
	// if mouse is down on the fake scroll
	// bar, handle that.
	if(scrollBarBool)scrollBarDrag(e);
	// reset our programs notion of here
	mouseY=e.clientY;
	// this means the user is draggin across
	// drawn text, so move the caret postion
	if (mouseDownBool){
		updateMouseDrag=e;
	}
	// figure out if mouse if hovering over
	// fake scrollbar, change mouse pointer if true
	var cp={x:e.clientX, y:e.clientY-headerHeight-8}; //canvas posititon of 
	if(e.clientX<editorWidth && e.clientX>scrollBarPos.x && cp.y>scrollBarPos.y && cp.y<scrollBarPos.y+scrollBarPos.h){
		goog.dom.getElement('canvasText').style.cursor = "default";
        if (!scrollBarHover)
            forceRepaint = true;
        scrollBarHover = true;
	}
	else{
        if (scrollBarHover)
            forceRepaint = true;
        scrollBarHover = false;
		//check if the mouse if over a note on the script
		var found=false;
		for(i in notesPosition){
			if (notesPosition[i][0]<e.clientX && notesPosition[i][0]+fontWidth>e.clientX){
				if(notesPosition[i][1]+headerHeight+6<e.clientY && notesPosition[i][1]+lineheight+headerHeight+6>e.clientY){
					found=notesPosition[i][2];
					break;
				}
			}
		}
		// if the mouse is over a note, make it clickable
		if (found!=false){
			goog.dom.getElement('canvasText').style.cursor='pointer';
			goog.events.listen(goog.dom.getElement('canvasText'), goog.events.EventType.CLICK, notesDialogFromScript);
		}
		else{
			goog.dom.getElement('canvasText').style.cursor = 'text';
			goog.events.unlisten(goog.dom.getElement('canvasText'), goog.events.EventType.CLICK, notesDialogFromScript);
		}
	}
}

/**
 * Simple, scroll when users used a mouse wheel or two finger mouse
 * pad scroll on canvas
 *
 * @param { goog.events.BrowserEvent} e Scroll event
 */
function handleMouseWheel(e){
    forceRepaint = true;
	scroll(e.deltaY*2)
}
/**
 * Figures out the posision in the text where the mouse is. Used for
 * onclick and onmousemove. God this is messy.  Redo it.
 *
 * @param { goog.event.BrowserEvent} e Mouse Move event
 *
 * @param { string } w "anch" for moving the selection anchor, or
 * "pos" for moving the caret
 */
function mousePosition(e, w){
	// pageBreaks
	// [0] first line on new page
	// [1] how many wrapped lines on the page (max 56)
	// [2] where the line is split across pages
	
	// We want the caret flashing NOW, so
	// update the milli
	var d = new Date();
	milli = d.getMilliseconds();
	
	pageSplit=false;
	var cy = e.clientY-92; //x on canvas (subtracking header height)
	var page = Math.round((vOffset+cy)/(72*lineheight)-0.5); // page clicked on
	var d = vOffset+cy-(72*lineheight*page);
	var l = Math.round(d/lineheight); // distance from top in lineheights
	l-=9 // don't calc whitespace
	if(l<0){
		if(page==0){
			var row=0;
			var col=0;
		}
		else{
			var row=pageBreaks[page-1][0];
			var col=pos.col=0
		}
	}
	else{
		if(page==0){
			var i=0; // first line on this page to count from
			var ly=linesNLB[i].length
		}
		else{
			var i = pageBreaks[page-1][0];// first line on this page to count from
			var ly = linesNLB[i].length-pageBreaks[page-1][2];
			if(lines[pageBreaks[page-1][0]].format==3)ly++; //add line for character CONT'D acrross pages
		}
		while(l>ly){
			if(i==lines.length-1) return {row:i, col:lines[i].text.length} //  if this is last page, cursor below the text
			i++;
			ly+=linesNLB[i].length;
			if(page<pageBreaks.length && i>=pageBreaks[page][0]){// handes pos in white space at end of page, 
				if(pageBreaks[page][2]==0)return {row:i-1, col:lines[i-1].text.length}// no split text
				
				pageSplit=true; // with split text across page
				break; 
			}
		}
		var w = linesNLB[i].length-(ly-l)-1; // which wrapped line
		
		var tc=0 //total characters
		//first add wraped lines before position
		var j=0;
		while(j<w){
			tc+=linesNLB[i][j].length+1;
			j++;
		}
		
		// now add to position based on mouse X
		var x = e.clientX-Math.round((editorWidth-fontWidth*87-24)/2)-textDistanceFromEdge[lines[i].format]*fontWidth; // x diastance into block of text
		var c = Math.round(x/fontWidth); // number of characters x represents
		if(c<0)c=0;
		if(c>linesNLB[i][j].length)c=linesNLB[i][j].length;
		
		tc+=c;
		if(tc>lines[i].text.length)tc=lines[i].text.length; // don't let the position be more than number of characters
		
		if(pageSplit==true){
			var ptc=0; //potential total characters
			j=0;
			while(j<pageBreaks[page][2]){
				ptc+=linesNLB[i][j].length+1;
				j++;
			}
			if(tc>ptc)tc=ptc-1;
		}
		
		
		var row = i;
		var col = tc;
	}
	return {row:row, col:col}
}
