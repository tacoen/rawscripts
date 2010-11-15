goog.require('goog.userAgent')
goog.require('goog.events')
goog.require('goog.dom');
goog.require('goog.dom.DomHelper');
goog.require('goog.events.EventType');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('goog.dom.ViewportSizeMonitor')
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('goog.ui.Menu');
goog.require('goog.ui.Container');
goog.require('goog.net.XhrIo');
goog.require('goog.array');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Option');
goog.require('goog.ui.SelectionModel');
goog.require('goog.ui.Separator');
goog.require('goog.ui.ButtonRenderer');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.CustomButtonRenderer');
goog.require('goog.ui.AutoComplete.Basic');
goog.require('goog.object');
goog.require('goog.format.EmailAddress');
goog.require('goog.ui.PopupMenu')

/**
 * @license Rawscripts.com copywrite 2010
 *
 *
 *
 */
window['removeAccess'] = removeAccess;
window['haveToUndelete'] = haveToUndelete;
window['sharePrompt'] = sharePrompt;
window['init'] = init;
window['hideEmailPrompt'] = hideEmailPrompt;
window['emailScript'] = emailScript;
window['hideRenamePrompt'] = hideRenamePrompt;
window['renameScript'] = renameScript;
window['hideUploadPrompt'] = hideUploadPrompt;
window['hideNewScriptPrompt'] = hideNewScriptPrompt;
window['createScript'] = createScript;
window['hideExportPrompt'] = hideExportPrompt;
window['exportScripts'] = exportScripts;
window['hideSharePrompt'] = hideSharePrompt;
window['shareScript'] = shareScript;
window['newScriptPrompt'] = newScriptPrompt;
window['uploadPrompt'] = uploadPrompt;
window['renamePrompt'] = renamePrompt;
window['duplicate'] = duplicate;
window['exportPrompt'] = exportPrompt;
window['batchProcess'] = batchProcess;
window['moveToFolder'] = moveToFolder;
window['exportPrompt'] = exportPrompt;
window['batchProcess'] = batchProcess;
window['refreshList'] = refreshList;
window['newFolder'] = newFolder;
window['selectAll'] = selectAll;
window['script'] = script;
window['emailPrompt'] = emailPrompt;
window['emailNotifyShare'] = emailNotifyShare;
window['emailNotifyMsg'] = emailNotifyMsg;




function init(){
	refreshList()
	goog.events.listen(goog.dom.getElement('renameField'), goog.events.EventType.KEYDOWN,
		function(e){
			if(e.keyCode==13){
				e.preventDefault();
				renameScript()
			}
		}
	);
	goog.events.listen(goog.dom.getElement('subject'), goog.events.EventType.KEYDOWN,
		function(e){
			if(e.keyCode==13){
				e.preventDefault();
			}
		}
	);
	goog.events.listen(goog.dom.getElement('newScript'), goog.events.EventType.KEYDOWN,
		function(e){
			if(e.keyCode==13){
				e.preventDefault();
				createScript();
			}
		}
	);
	var arr = ['ownedFolder', 'sharedFolder', 'trashFolder'];
	for (i in arr){
		var f = goog.dom.getElement(arr[i]);
		goog.events.listen(f, goog.events.EventType.CLICK, function(e){
			goog.dom.getElementByClass('current').style.backgroundColor='white';
			goog.dom.getElementByClass('current').className='tab';
			e.target.className='tab current';
			tabs(e.target.id)
			e.target.style.backgroundColor = '#2352AE';
		});
		goog.events.listen(f, goog.events.EventType.MOUSEOVER, function(e){
			if(e.target.className!='tab current'){
				e.target.style.backgroundColor = '#ccf'
			}
			else{
				e.target.style.backgroundColor = '#2352AE'
			}
		});
		goog.events.listen(f, goog.events.EventType.MOUSEOUT, function(e){
			if(e.target.className!='tab current'){
				e.target.style.backgroundColor = '#fff'
			}
		});
	}
	try{
		goog.net.XhrIo.send('/synccontacts',
			function(e){
				if(e.target.getResponseText()=='none')return;
				try{
					var arr = e.target.getResponseJson();
					var emailAutoComplete = new goog.ui.AutoComplete.Basic(arr, goog.dom.getElement('recipient'), true);
					var shareAutoComplete = new goog.ui.AutoComplete.Basic(arr, goog.dom.getElement('collaborator'), true);
				}
				catch(e){};
			},
			'POST'
		);
	}
	catch(e){};
}
function uploadWindow(evt){
	if (evt.data == 'uploading'){
		goog.dom.getElement('uploadFrame').height= '0px';
		goog.dom.getElement('uploadFrame').width= '0px';
		goog.dom.getElement('uploading').style.display = 'block';
	}
	else{
		goog.dom.getElement('uploadFrame').style.height= '210px';
		goog.dom.getElement('uploadFrame').style.width= '250px';
		goog.dom.getElement('uploading').style.display = 'none';
		window.open('editor?resource_id='+evt.data);
		refreshList();
	}
}
goog.events.listen(window, goog.events.EventType.CLICK, click)
goog.events.listen(window, goog.events.EventType.CONTEXTMENU, contextmenu)
function click(){
	if(goog.dom.getElement('folder_context_menu')!=null){
		goog.dom.removeNode('folder_context_menu');
	}
}
var folder_id=""
function contextmenu(e){
	if(goog.dom.getElement('folder_context_menu')!=null){
		goog.dom.removeNode('folder_context_menu')
	}
	if(e.target.className=="tab" || e.target.className=="tab current"){
		if(e.target.id!="ownedFolder" && e.target.id!="sharedFolder" && e.target.id!="trashFolder"){
			e.preventDefault();
			folder_id=e.target.id;
			var menu = new goog.ui.PopupMenu();
			menu.setId('folder_context_menu');
			menu.addItem(new goog.ui.MenuItem('Rename Folder'));
			menu.addItem(new goog.ui.MenuItem('Delete Folder'));
			menu.render(document.body);
			menu.setPosition(e.clientX,e.clientY);
			menu.setVisible(true)
			goog.events.listen(menu, 'action', folderContextMenuAction)
		}
	}
}
function folderContextMenuAction(e){
	if(e.target.content_=='Rename Folder'){
		renameFolder(folder_id.replace('Folder',''))
	}
	else if(e.target.content_=='Delete Folder'){
		deleteFolder(folder_id.replace('Folder',''))
	}

}
function tabs(v){
	var c = document.getElementsByTagName('input');
	for (var i=0; i<c.length; i++){
		if (c[i].type == 'checkbox'){
			c[i].checked = false;
		}
	}
	var c = document.getElementsByTagName('div');
	for(i in c){
		if(c[i].className=="folderContents")c[i].style.display="none";
		if(c[i].className=="buttons_block")c[i].style.display="none";
	}
	goog.dom.getElement(v.replace("Folder","")).style.display="block";
	if(v!="ownedFolder" && v!="sharedFolder"  && v!="trashFolder")v="owned_buttons";
	goog.dom.getElement(v.replace("Folder","_buttons")).style.display="block";
}

function newFolder(){
	var f = prompt("New Folder Name");
	f=f.replace(/^\s+/,"").replace(/\s+$/,"");
	if(f!=null && f!=""){
		var id = Math.round(Math.random()*10000000000);
		goog.net.XhrIo.send('/newfolder',
			function(){},
			'POST',
			'folder_name='+escape(f)+'&folder_id='+id
		)
		var d = goog.dom.getElement('user_folders').appendChild(document.createElement('div'));
		d.className="tab";
		d.id="Folder"+id;
		d.appendChild(document.createElement("img")).src="images/folder.png";
		d.appendChild(document.createTextNode(" "+f));
		var folderContents=goog.dom.getElement('contents').appendChild(document.createElement("div"));
		folderContents.id=id;
		folderContents.className='folderContents';
		folderContents.style.display="none";
		var ch = folderContents.appendChild(document.createElement('div'))
		ch.className="contentsHeader";
		var table = ch.appendChild(document.createElement('table'));
		table.width="100%";
		tr = table.appendChild(document.createElement('tr'));
		var td = tr.appendChild(document.createElement('td'));
		td.style.width="15px";
		var cb = td.appendChild(document.createElement('input'));
		cb.type='checkbox';
		cb.style.visibility="hidden";
		tr.appendChild(document.createElement('td')).appendChild(document.createTextNode(f));
		td = tr.appendChild(document.createElement('td'));
		td.style.width="120px";
		td.align = "center";
		td.appendChild(document.createTextNode("Shared With"));
		td = tr.appendChild(document.createElement('td'));
		td.style.width="120px";
		td.align = "center";
		td.appendChild(document.createTextNode("Email"));
		td = tr.appendChild(document.createElement('td'));
		td.style.width="160px";
		td.align = "center";
		var option = goog.dom.getElement('move_to_folder').appendChild(document.createElement('option'));
		option.appendChild(document.createTextNode(f));
		option.value=id;
		td.appendChild(document.createTextNode("Last Modified"));
		goog.events.listen(d, goog.events.EventType.CLICK, function(e){
			goog.dom.getElementByClass('current').style.backgroundColor='white';
			goog.dom.getElementByClass('current').className='tab';
			e.target.className='tab current';
			tabs(e.target.id)
			e.target.style.backgroundColor = '#2352AE';
		});
		goog.events.listen(d, goog.events.EventType.MOUSEOVER, function(e){
			if(e.target.className!='tab current'){
				e.target.style.backgroundColor = '#ccf'
			}
			else{
				e.target.style.backgroundColor = '#2352AE'
			}
		});
		goog.events.listen(d, goog.events.EventType.MOUSEOUT, function(e){
			if(e.target.className!='tab current'){
				e.target.style.backgroundColor = '#fff'
			}
		});
	}
}

function moveToFolder(v){
	if(v!="move_to"){
		var c = document.getElementsByTagName("input");
		var found = false;
		var arr = [];
		for (i in c){
			if (c[i].type=="checkbox" && c[i].checked==true && c[i].parentNode.className=="checkboxCell"){
				var e = c[i];
				while(e.nodeName!="DIV")e=e.parentNode;
				e.style.backgroundColor = '#ccc';
				e.style.opacity = '0.5';
				found=true;
				arr.push(c[i].value)
			}
		}
		if(found==true){
			goog.net.XhrIo.send('/changefolder',
				refreshList,
				'POST',
				'resource_id='+arr.join(',')+'&folder_id='+v
			);
		}
		goog.dom.getElement("move_to_folder").selectedIndex=0;
	}
}

function refreshList(v){
	goog.dom.getElement("refresh_icon").style.visibility="visible";
	goog.net.XhrIo.send('/list',
		function(d){
		    //update with new info
			var j = d.target.getResponseJson();
		    var x=j[0];
		    var z=j[1];
		    var ss=j[2];
			var folders=j[3];
			// know which tab is current, to be rest
			//set up folders
			var current = goog.dom.getElementByClass('current').id;
			var fc = goog.dom.getElementsByClass('folderContents');
			for (i in fc){
				if(fc[i].id!='owned' && fc[i].id!='shared' && fc[i].id!='trash'){
					goog.dom.removeNode(fc[i])
				}
			}
			var d=goog.dom.getElement('user_folders');
			d.innerHTML="";
			var select = goog.dom.getElement('move_to_folder');
			select.innerHTML="<option value='move_to'>Move To Folder...</option><option value='?none?'>Remove From Folder</option>";
			for(i in folders){
				var f = d.appendChild(document.createElement('div'));
				f.className="tab";
				f.id="Folder"+folders[i][1];
				f.appendChild(document.createElement('img')).src="images/folder.png";
				f.appendChild(document.createTextNode(' '+folders[i][0]))
				var option = select.appendChild(document.createElement('option'))
				option.appendChild(document.createTextNode(folders[i][0]));
				option.value=folders[i][1];
				var folderContents=goog.dom.getElement('contents').appendChild(document.createElement("div"));
				folderContents.id=folders[i][1];
				folderContents.className='folderContents';
				folderContents.style.display="none";
				var ch = folderContents.appendChild(document.createElement('div'))
				ch.className="contentsHeader";
				var table = ch.appendChild(document.createElement('table'));
				table.width="100%";
				tr = table.appendChild(document.createElement('tr'));
				var td = tr.appendChild(document.createElement('td'));
				td.style.width="15px";
				var cb = td.appendChild(document.createElement('input'));
				cb.type='checkbox';
				cb.style.visibility="hidden"
				var n = tr.appendChild(document.createElement('td'))
				n.appendChild(document.createTextNode(folders[i][0]));
				td = tr.appendChild(document.createElement('td'));
				td.style.width="120px";
				td.align = "center";
				td.appendChild(document.createTextNode("Shared With"));
				td = tr.appendChild(document.createElement('td'));
				td.style.width="120px";
				td.align = "center";
				td.appendChild(document.createTextNode("Email"));
				td = tr.appendChild(document.createElement('td'));
				td.style.width="160px";
				td.align = "center";
				td.appendChild(document.createTextNode("Last Modified"));
				goog.events.listen(f, goog.events.EventType.CLICK, function(e){
					goog.dom.getElementByClass('current').style.backgroundColor='white';
					goog.dom.getElementByClass('current').className='tab';
					e.target.className='tab current';
					tabs(e.target.id)
					e.target.style.backgroundColor = '#2352AE';
				});
				goog.events.listen(f, goog.events.EventType.MOUSEOVER, function(e){
					if(e.target.className!='tab current'){
						e.target.style.backgroundColor = '#ccf'
					}
					else{
						e.target.style.backgroundColor = '#2352AE'
					}
				});
				goog.events.listen(f, goog.events.EventType.MOUSEOUT, function(e){
					if(e.target.className!='tab current'){
						e.target.style.backgroundColor = '#fff'
					}
				});
			}
			goog.dom.getElement('loading').style.display = 'none';
		    //remove old data
		    var childs = goog.dom.getElement('content').childNodes;
		    for (var i=0; i<childs.length; i++){
		        childs[i].parentNode.removeChild(childs[i]);
		        i--;
		    }
			var listDiv = goog.dom.getElement('content').appendChild(document.createElement('div'));
		    listDiv.id = 'list';
			goog.dom.getElement('noentries').style.display=(x.length==0 ? "block" : "none");
		    for (var i=0; i<x.length; i++){
		        var title = x[i][1];
		        var resource_id = x[i][0];
		        var updated = x[i][2];
		        var shared_with=x[i][4];
				var new_notes=x[i][5];
				var folder = x[i][6];
		        var entryDiv = listDiv.appendChild(document.createElement('div'));
		        entryDiv.id = resource_id;
		        entryDiv.className = 'entry';
		        var entryTable = entryDiv.appendChild(document.createElement('table'));
		        entryTable.width = '100%';
		        var entryTr = entryTable.appendChild(document.createElement('tr'));
		        //make checkbox
		        var checkboxTd = entryTr.appendChild(document.createElement('td'));
		        checkboxTd.className='checkboxCell';
		        var input = checkboxTd.appendChild(document.createElement('input'));
		        input.type='checkbox';
		        input.name = 'listItems';
		        input.value = resource_id;
		        //make title
		        var titleCell = entryTr.appendChild(document.createElement('td'));
		        var titleLink = titleCell.appendChild(document.createElement('a'));
		        titleLink.id = 'name'+resource_id;
		        if (new_notes!=0){
		            var newNotesSpan = titleCell.appendChild(document.createElement('span'));
		            newNotesSpan.appendChild(document.createTextNode((new_notes==1 ? " New Note" : " "+new_notes+' New Notes')));
		            newNotesSpan.className = 'redAlertSpan';
		        }
		        var href = 'javascript:script("'+resource_id+'")';
		        titleLink.href=href;
		        titleLink.appendChild(document.createTextNode(title));
				//folder column
				var folderTd  = entryTr.appendChild(document.createElement('td'));
				folderTd.align = "center";
				folderTd.className="folderCell";
				if(folder!="?none?"){
					for(fold in folders){
						if (folders[fold][1]==folder){
							var span = folderTd.appendChild(document.createElement('span'));
							span.appendChild(document.createTextNode(folders[fold][0]));
							span.className="folderSpan";
						}
					}
				}
		        //shared column
		        var sharedTd = entryTr.appendChild(document.createElement('td'));
		        sharedTd.className = 'sharedCell';
		        sharedTd.align = 'right';
        
		        if (shared_with.length==0){
		            var collabs = '';
		        }
		        else{
		            if (shared_with.length==1){
		                var collabs = '1 person ';
		            }
		            else {
		                var collabs = String(shared_with.length)+" people ";
		            }
		        }
		        sharedTd.appendChild(document.createTextNode(collabs));
		        var manage = sharedTd.appendChild(document.createElement('a'));
		        var href = "javascript:sharePrompt('"+resource_id+"')";
		        manage.href=href;
		        manage.appendChild(document.createTextNode('Manage'));
		        manage.id = 'share'+resource_id;
		        manage.title = shared_with.join('&');
        
		        //email column
		        var emailTd = entryTr.appendChild(document.createElement('td'));
		        emailTd.className = 'emailCell';
		        emailTd.align='center';
		        var emailLink = emailTd.appendChild(document.createElement('a'));
		        emailLink.className = 'emailLink';
		        href = 'javascript:emailPrompt("'+resource_id+'")';
		        emailLink.href=href;
		        emailLink.appendChild(document.createTextNode('Email'));
		        // Last updated
		        var updatedTd = entryTr.appendChild(document.createElement('td'));
		        updatedTd.className = 'updatedCell';
		        updatedTd.align='center';
		        updatedTd.appendChild(document.createTextNode(updated));
				if(folder!="?none?"){
					var obj = entryDiv.cloneNode(true);
					var obj = goog.dom.getElement(folder).appendChild(obj);
					obj.getElementsByTagName("input")[0].name="listItems"+folder;
				}
			}
		    // showing sharing scripts
		    //remove old data
		    var childs = goog.dom.getElement('sharedContent').childNodes;
		    for (var i=0; i<childs.length; i++){
		        childs[i].parentNode.removeChild(childs[i]);
		        i--;
		    }
		    goog.dom.getElement('sharedLoading').style.display='none';
		    goog.dom.getElement('sharedNoEntries').style.display=(ss.length==0 ? 'block' :'none');
		    var listDiv = goog.dom.getElement('sharedContent').appendChild(document.createElement('div'));
		    listDiv.id = 'sharedList';
			var number_unopened = 0;
		    for (i in ss){
		        var resource_id=ss[i][0];
		        var title = ss[i][1];
		        var updated = ss[i][2];
		        var owner = ss[i][3];
				var new_notes=ss[i][4];
				var unopened = ss[i][6];
		        var entryDiv = listDiv.appendChild(document.createElement('div'));
		        entryDiv.id = resource_id;
		        entryDiv.className = 'entry';
		        var entryTable = entryDiv.appendChild(document.createElement('table'));
		        entryTable.width = '100%';
		        var entryTr = entryTable.appendChild(document.createElement('tr'));
		        //make checkbox
		        var checkboxTd = entryTr.appendChild(document.createElement('td'));
		        checkboxTd.className='checkboxCell';
		        var input = checkboxTd.appendChild(document.createElement('input'));
		        input.type='checkbox';
		        input.name = 'sharedListItems';
		        input.value = resource_id;
		        //make title
		        var titleCell = entryTr.appendChild(document.createElement('td'));
		        var titleLink = titleCell.appendChild(document.createElement('a'));
		        titleLink.id = 'name'+resource_id;
		        var href = 'javascript:script("'+resource_id+'")';
		        titleLink.href=href;
		        titleLink.appendChild(document.createTextNode(title));
				if (unopened=="True"){
					var newNotesSpan = titleCell.appendChild(document.createElement('span'));
		            newNotesSpan.appendChild(document.createTextNode(" New Script"));
		            newNotesSpan.className = 'redAlertSpan';
					number_unopened++;
				}
				else if (new_notes!=0){
		            var newNotesSpan = titleCell.appendChild(document.createElement('span'));
		            newNotesSpan.appendChild(document.createTextNode((new_notes==1 ? " New Note  " : " "+new_notes+' New Notes  ')));
		            newNotesSpan.className = 'redAlertSpan';
		        }
		        //show owner
		        var ownerTd = entryTr.appendChild(document.createElement('td'));
		        ownerTd.appendChild(document.createTextNode(owner));
		        ownerTd.align="right";
		        ownerTd.className='ownerCell';
		        //updated
		        var updatedTd = entryTr.appendChild(document.createElement('td'));
		        updatedTd.className="updatedCell";
		        updatedTd.align="center";
		        updatedTd.appendChild(document.createTextNode(updated));
		    }
		    goog.dom.getElement("sharedFolder").innerHTML = "Shared With Me"+(number_unopened==0 ? "" : " ("+number_unopened+")")
    
		    goog.dom.getElement('trashLoading').style.display = 'none';
		    goog.dom.getElement('trashNoEntries').style.display=(z.length==0 ? 'block' :'none');
		    //remove old data
		    var childs = goog.dom.getElement('trashContent').childNodes;
		    for (var i=0; i<childs.length; i++){
		        childs[i].parentNode.removeChild(childs[i]);
		        i--;
		    }
		    //update with new info
		    var listDiv = goog.dom.getElement('trashContent').appendChild(document.createElement('div'));
		    listDiv.id = 'trashList';
			x=z;
		    for(i in x){
		        var title = x[i][1];
		        var resource_id = x[i][0];
		        var updated = x[i][2]
		        var shared_with=x[i][4]
				var folder = x[i][5];
		        var entryDiv = listDiv.appendChild(document.createElement('div'));
		        entryDiv.id = resource_id;
		        entryDiv.className = 'entry';
		        var entryTable = entryDiv.appendChild(document.createElement('table'));
		        entryTable.width = '100%';
		        var entryTr = entryTable.appendChild(document.createElement('tr'));
		        //make checkbox
		        var checkboxTd = entryTr.appendChild(document.createElement('td'));
		        checkboxTd.className='checkboxCell';
		        var input = checkboxTd.appendChild(document.createElement('input'));
		        input.type='checkbox';
		        input.name = 'trashListItems';
		        input.value = resource_id;
		        //make title
		        var titleCell = entryTr.appendChild(document.createElement('td'));
		        var titleLink = titleCell.appendChild(document.createElement('a'));
		        titleLink.id = 'name'+resource_id;
		        /*
		        if (newNotes==true){
		            var newNotesSpan = titleCell.appendChild(document.createElement('span'));
		            newNotesSpan.appendChild(document.createTextNode(' New Notes'));
		            newNotesSpan.className = 'redAlertSpan';
		        }
		        */
		        var href = 'javascript:haveToUndelete()';
		        titleLink.href=href;
		        titleLink.appendChild(document.createTextNode(title));
				//folder column
				var folderTd  = entryTr.appendChild(document.createElement('td'));
				folderTd.align = "center";
				folderTd.className="folderCell";
				if(folder!="?none?"){
					for(fold in folders){
						if (folders[fold][1]==folder){
							var span = folderTd.appendChild(document.createElement('span'));
							span.appendChild(document.createTextNode(folders[fold][0]));
							span.className="folderSpan";
						}
					}
				}
				folderTd.style.display="none";
		        //shared column
		        var sharedTd = entryTr.appendChild(document.createElement('td'));
		        sharedTd.className = 'sharedCell';
		        sharedTd.align = 'right';
        
		        if (shared_with.length==0){
		            var collabs = '';
		        }
		        else{
		            if (shared_with.length==1){
		                var collabs = '1 person ';
		            }
		            else {
		                var collabs = String(shared_with.length)+" people ";
		            }
		        }
		        sharedTd.appendChild(document.createTextNode(collabs));
		        var manage = sharedTd.appendChild(document.createElement('a'));
		        var href = "javascript:sharePrompt('"+resource_id+"')";
		        manage.href=href;
		        manage.appendChild(document.createTextNode('Manage'));
		        manage.id = 'share'+resource_id;
		        manage.title = shared_with.join('&');
				sharedTd.style.display="none";
        
		        //email column
		        var emailTd = entryTr.appendChild(document.createElement('td'));
		        emailTd.className = 'emailCell';
		        emailTd.align='center';
		        var emailLink = emailTd.appendChild(document.createElement('a'));
		        emailLink.className = 'emailLink';
		        href = 'javascript:emailPrompt("'+resource_id+'")';
		        emailLink.href=href;
		        emailLink.appendChild(document.createTextNode('Email'));
				emailTd.style.display="none";
		        // Last updated
		        var updatedTd = entryTr.appendChild(document.createElement('td'));
		        updatedTd.className = 'updatedCell';
		        updatedTd.align='center';
		        updatedTd.appendChild(document.createTextNode(updated));
		
		    }
			if(goog.dom.getElement(current)==null)current="ownedFolder"
			goog.dom.getElement(current).className = goog.dom.getElement(current).className.replace(" current","")+" current";
			goog.dom.getElement(current).style.backgroundColor="#2352AE";
			tabs(current);
			if(v && typeof(v)!='object'){
				sharePrompt(v);
			}
			goog.dom.getElement("refresh_icon").style.visibility="hidden";
		},
		'POST'
	);
}
function renameFolder(v){
	var prev_title=goog.dom.getTextContent(goog.dom.getElement('Folder'+v));
	var f = prompt("Rename Folder", prev_title)
	if(f!=null){
		f=f.replace(/^\s+/,"").replace(/\s+$/,"");
		if(f!=""){
			var folder_id = v.replace("Folder", "");
			var d = goog.dom.getElement(v);
			d.innerHTML="";
			d.appendChild(document.createElement("img")).src="images/folder.png";
			d.appendChild(document.createElement("span")).appendChild(document.createTextNode(" "));
			d.appendChild(document.createTextNode(f));
			goog.net.XhrIo.send('/renamefolder',
				refreshList,
				'POST',
				'folder_name='+f+'&folder_id='+folder_id
			);
		}
	}
}
function deleteFolder(){
	var c = confirm("Are you sure you want to delete this folder?")
	if(c==true){
		var f = folder_id.replace('Folder','');
		goog.net.XhrIo.send('/deletefolder',
			refreshList,
			'POST',
			'folder_id='+f
		);
	}
}
function selectAll(obj, which){
	var listItems = document.getElementsByTagName('input');
	var bool = obj.checked
	for(var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if(listItems[i].name ==which){
				listItems[i].checked = bool;
			}
		}
	}
}


function script(v){
url = '/editor?resource_id=' + v;
window.open(url);
setTimeout('refreshList()',5000);
}
function haveToUndelete(){
	alert("You have to Undelete this script to view it.\n\nThe Undelete button is right above your scriptlist.");
}
function deleteScript(v){
	var scriptDiv = goog.dom.getElement(v);
	scriptDiv.style.backgroundColor = '#ccc';
	scriptDiv.style.opacity = '0.5';
	var c = document.getElementsByTagName('div');
	for (i in c){
		if(c[i].className=="entry" && c[i].id==v && c[i]!=scriptDiv){
			c[i].style.backgroundColor = '#ccc';
			c[i].style.opacity = '0.5';
		}
	}
	goog.net.XhrIo.send('/delete',
		function(){
	        scriptDiv.parentNode.removeChild(scriptDiv);
	        goog.dom.getElement('trashList').appendChild(scriptDiv);
	        scriptDiv.style.backgroundColor='#f9f9fc';
	        scriptDiv.style.opacity='1';
	        var t=scriptDiv.firstChild;
	        t=(t.nodeName=='#text' ? t.nextSibling : t);
	        t.getElementsByTagName('input')[0].name='trashListItems';
	        var c = t.getElementsByTagName('td');
	        c[2].style.display="none";
			c[3].style.display='none';
			c[4].style.display="none";
			c[1].firstChild.href="javascript:haveToUndelete()";
			goog.dom.getElement("trashNoEntries").style.display="none";
			var c = document.getElementsByTagName('div');
			for (i in c){
				if(c[i].className=="entry" && c[i].id==v && c[i]!=scriptDiv){
					c[i].parentNode.removeChild(c[i])
				}
			}
        },
		'POST',
		'resource_id='+v
		);
}

function undelete(v){
    var scriptDiv = goog.dom.getElement(v);
	scriptDiv.style.backgroundColor = '#ccc';
	scriptDiv.style.opacity = '0.5';
	goog.net.XhrIo.send('/undelete',
		function(){
			scriptDiv.parentNode.removeChild(scriptDiv);
			goog.dom.getElement('list').appendChild(scriptDiv);
			scriptDiv.style.backgroundColor='#f9f9fc';
			scriptDiv.style.opacity='1';
			var t=scriptDiv.firstChild;
			t=(t.nodeName=='#text' ? t.nextSibling : t);
			t=t.firstChild;
			t=(t.nodeName=='#text' ? t.nextSibling : t);
			var c = t.getElementsByTagName('td');
			t.getElementsByTagName('input')[0].name='listItems';
			t.getElementsByTagName('a')[0].href="javascript:script('"+v+"')"
			for (i in c){
				if (c[i].style!=undefined)c[i].style.display="table-cell"
			}
			goog.dom.getElement("noentries").style.display="none";
		},
		'POST',
		'resource_id='+v
	);
}

function hardDelete(v){
    var scriptDiv = goog.dom.getElement(v);
    scriptDiv.style.backgroundColor = '#ccc';
    scriptDiv.style.opacity = '0.5';
	goog.net.Xhr.send('/harddelete',
		function(){
			scriptDiv.parentNode.removeChild(scriptDiv);
		},
		'POST',
		'resource_id='+v
	);
}


function batchProcess(v){
    var con = true;
    if(v=='hardDelete'){
        con=false;
        if (confirm("Are you sure you want to delete these scripts? This cannot be undone."))con=true;
    }
    if(con){
		var found=false;
        var listItems = document.getElementsByTagName('input');
        for (var i=0; i<listItems.length; i++){
            if(listItems[i].type == 'checkbox'){
                if (listItems[i].checked == true){
                    if (listItems[i].name.substr(0,9) == 'listItems' || listItems[i].name=='sharedListItems' || listItems[i].name=='trashListItems'){
                        if(v=='delete')	deleteScript(listItems[i].value);
                        if(v=='undelete')undelete(listItems[i].value);
                        if(v=='hardDelete')hardDelete(listItems[i].value);
						found=true;
                    }			
                }
            }
        }
		if(found==true)setTimeout("refreshList()", 5000);
    }
}

function emailComplete(e){
	
	goog.dom.getElement('emailS').disabled = false;
	goog.dom.getElement('emailS').value = 'Send';
	if (e.target.getResponseText()=='sent'){
		alert("Email Sent")
		hideEmailPrompt();
	}
	else{
		alert("There was a problem sending your email. Please try again later.")
	}
}
function emailScript(){
	var r = goog.format.EmailAddress.parseList(goog.dom.getElement('recipient').value)
	var arr=[];
	for(i in r){
		if(r[i].address_!="")arr.push(r[i].address_);
	}
	if(arr.length==0){
		alert('You need to add at least one email address.')
		return;
	}
	var recipients = arr.join(',');
	var subject = goog.dom.getElement('subject').value;
	if(subject=="")subject="Script";
	var body_message = goog.dom.getElement('message').innerHTML;
    var title_page = goog.dom.getElement("emailTitle").selectedIndex;
	goog.net.XhrIo.send('emailscript',
		emailComplete,
		'POST',
		'resource_id='+resource_id+'&recipients='+recipients+'&subject='+escape(subject)+'&body_message='+escape(body_message)+'&fromPage=scriptlist&title_page='+title_page
	);
	goog.dom.getElement('emailS').disabled = true;
	goog.dom.getElement('emailS').value = 'Sending...';
}
var resource_id="";
function emailPrompt(v){
	resource_id=v;
	goog.dom.getElement('emailpopup').style.visibility = 'visible';
    goog.dom.getElement('edit_title_href').href='/titlepage?resource_id='+resource_id
}
function hideEmailPrompt(){
goog.dom.getElement('emailpopup').style.visibility = 'hidden';
goog.dom.getElement('recipient').value = "";
goog.dom.getElement('subject').value = "";
goog.dom.getElement('message').innerHTML = "";
}

function duplicate(){
    var counter = 0;
	var listItems = document.getElementsByTagName('input');
	for (var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if (listItems[i].checked == true){
				if (listItems[i].name == 'listItems'){
					var resource_id = listItems[i].value;
					counter++;
				}
			}
		}
	}
	if(counter>1)alert("select one at a time");
	else if (counter==1){
		goog.net.XhrIo.send('/duplicate',
			function(d){
				if(d.target.getResponseText()=='fail')return;
				else{
					window.open(d.target.getResponseText());
					refreshList()
				}
			},
			'POST',
			'resource_id='+resource_id+'&fromPage=scriptlist'
		);
    }
}

function renamePrompt(){
	var counter = 0;
	var listItems = document.getElementsByTagName('input');
	for (var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if (listItems[i].checked == true){
				if (listItems[i].name == 'listItems'){
					var resource_id = listItems[i].value;
					counter++;
				}
			}
		}
	}
	if(counter>1)alert("select one at a time");
	else if (counter==1){
		var title = 'name' + resource_id;
		goog.dom.getElement('renameTitle').innerHTML = "Rename " + goog.dom.getElement(title).innerHTML;
		goog.dom.getElement('renameField').value = goog.dom.getElement(title).innerHTML;
		goog.dom.getElement('renamepopup').style.visibility = 'visible';
		goog.dom.getElement('resource_id').value = resource_id;
	}
	
	}

function hideRenamePrompt(){
	goog.dom.getElement('renameField').value = "";
	goog.dom.getElement('renamepopup').style.visibility = 'hidden';
	}
	
function renameScript(){
	var resource_id = goog.dom.getElement('resource_id').value;
	var rename = goog.dom.getElement('renameField').value;
	if (rename==""){return;}
	var id = "name"+resource_id;
	goog.dom.getElement(id).innerHTML = rename;
	goog.net.XhrIo.send('/rename',
		function(){},
		'POST',
		'resource_id='+resource_id+'&rename='+rename+'&fromPage=scriptlist'
	);
	hideRenamePrompt()
	}
	
function uploadPrompt(){
	goog.dom.getElement('uploadpopup').style.visibility = 'visible';
	}
function hideUploadPrompt(){
	goog.dom.getElement('uploadFrame').src = '/convert';
	goog.dom.getElement('uploadpopup').style.visibility = 'hidden';
	}
function newScriptPrompt(){
	goog.dom.getElement('newscriptpopup').style.visibility = 'visible';
	goog.dom.getElement('newScript').value = "Untitled Screenplay";
	goog.dom.getElement('newScript').focus();
	goog.dom.getElement('newScript').select();
	}
function hideNewScriptPrompt(){
	goog.dom.getElement('newScript').value = "";
	goog.dom.getElement('newscriptpopup').style.visibility = 'hidden';
	goog.dom.getElement('createScriptButton').disabled=false;
	goog.dom.getElement('createScriptButton').value="Create";
	goog.dom.getElement('createScriptIcon').style.visibility="hidden";
}

function createScript (){
	var filename = goog.dom.getElement('newScript').value;
	if (filename!=''){
		goog.dom.getElement('createScriptButton').disabled=true;
		goog.dom.getElement('createScriptButton').value="Creating Script...";
		goog.dom.getElement('createScriptIcon').style.visibility="visible";
		goog.net.XhrIo.send('/newscript',
			function(d){
				window.open('/editor?resource_id='+d.target.getResponseText());
				hideNewScriptPrompt();
				refreshList();
			},
			'POST',
			'fromPage=scriptlist&filename='+escape(filename)
		);
	}
}
//window.addEventListener("message", uploadWindow, false); 
window.addEventListener("message", recieveMessage, false);
function recieveMessage(e){
	if(e.origin!="http://www.rawscripts.com")return;
	if(e.data=="uploading"){
		goog.dom.getElement("uploading").style.display="block";
		goog.dom.getElement("uploadFrame").style.display="none";
	}
	else{
		goog.dom.getElement("uploading").style.display="none";
		goog.dom.getElement("uploadFrame").style.display="block";
		window.open("/editor?resource_id="+e.data);
		refreshList();
	}
    
}
function hideExportPrompt(){
	goog.dom.getElement('exportpopup').style.visibility = 'hidden';
	goog.dom.getElement('exportList').innerHTML = '';
	}
function exportPrompt(){
	var counter = 0;
	var listItems = document.getElementsByTagName('input');
	for (var i=0; i<listItems.length; i++){
		if(listItems[i].type == 'checkbox'){
			if (listItems[i].checked == true){
				if (listItems[i].name == 'listItems' || listItems[i].name=='sharedListItems'){
					var newRow = document.createElement('tr');
					var row = goog.dom.getElement('exportList').appendChild(newRow);
					var newData = row.appendChild(document.createElement('td'));
					var newTxt = document.createTextNode(goog.dom.getElement('name'+listItems[i].value).innerHTML);
					newData.appendChild(newTxt);
					//Create Selection cell					
					newData = row.appendChild(document.createElement('td'));
					var newSelect = document.createElement('select');
					var select = newData.appendChild(newSelect);
					select.name = listItems[i].value;
					var option = select.appendChild(document.createElement('option'));
					option.appendChild(document.createTextNode('Adobe PDF'));
					option = select.appendChild(document.createElement('option'));
					option.appendChild(document.createTextNode('txt (for Celtx or FD)'));
                    newData = newRow.appendChild(document.createElement('td'));
                    newSelect = newData.appendChild(document.createElement('select'));
                    newSelect.name="export_format";
                    option = newSelect.appendChild(document.createElement('option'));
                    option.appendChild(document.createTextNode('Without Title Page'));
                    option = newSelect.appendChild(document.createElement('option'));
                    option.appendChild(document.createTextNode('With Title Page'));
                    var a = newRow.appendChild(document.createElement('td')).appendChild(document.createElement('a'));
                    a.appendChild(document.createTextNode('Edit Title page'));
                    a.href="/titlepage?resource_id="+listItems[i].value;
                    a.target="_blank"
					counter++;
				}
			}
		}
	}
	if (counter>0){
		goog.dom.getElement('exportpopup').style.visibility = 'visible';
		}
	}
function exportScripts(){
	var id;
	var format;
	var exports = document.getElementsByTagName('select');
	for (var i=0; i<exports.length; i++){
        if(exports[i].name!='export_format' && exports[i].name!=''){
            id = exports[i].name;
            if (exports[i].selectedIndex == 0){format = 'pdf';}
            else{format = 'txt';}
            var n = exports[i].parentNode;
            n = n.nextSibling;
            if(n.nodeName=="#text")n=n.nextSibling;
            n=n.firstChild;
            if(n.nodeName=="#text")n=n.nextSibling;
            var title = "&title_page="+n.selectedIndex;
            url = '/export?resource_id=' + id + '&export_format=' + format + '&fromPage=scriptlist'+title;
            window.open(url);
        }
    }
	hideExportPrompt();
}
//-----------------Done Export Functions------
//
//
//-----------------Start Share Functions------
function removeAccess(v){
	var bool = confirm("Are you sure you want to take away access from "+v+"?");
	if (bool==true){
		var resource_id = goog.dom.getElement('shareResource_id').value;
		goog.net.XhrIo.send('/removeaccess',
			removeShareUser,
			'POST',
			'resource_id='+resource_id+'&fromPage=scriptlist&removePerson='+v
		);
		goog.dom.getElement('shared'+v.toLowerCase()).style.opacity = '0.5';
		goog.dom.getElement('shared'+v.toLowerCase()).style.backgroundColor = '#ddd';
	}
}
function removeShareUser(d){
	var data = d.target.getResponseText();
	goog.dom.getElement('shared'+data).parentNode.removeChild(goog.dom.getElement('shared'+data));
	refreshList();
}
function sharePrompt(v){
	goog.dom.getElement('shareS').disabled = false;
	goog.dom.getElement('shareS').value = "Send Invitation";
	var collabs = (goog.dom.getElement('share'+v).title=="" ? [] : goog.dom.getElement('share'+v).title.split("&"));
	var hasAccess = goog.dom.getElement('hasAccess');
	goog.dom.getElement('collaborator').value = "";
	hasAccess.innerHTML="";
	for (var i=0; i<collabs.length; i++){
		if(collabs[i]!='none'){
			var collabTr = hasAccess.appendChild(document.createElement('tr'));
			collabTr.id='shared'+collabs[i].toLowerCase();
			var emailTd = collabTr.appendChild(document.createElement('td'));
			emailTd.appendChild(document.createTextNode(collabs[i]));
			var remove = collabTr.appendChild(document.createElement('td'));
			remove.align='right';
			var newA = remove.appendChild(document.createElement('a'));
			newA.appendChild(document.createTextNode('Remove Access'));
			var href = "javascript:removeAccess('"+collabs[i]+"')";
			newA.href = href;
		}
	}
	goog.dom.getElement('shareTitle').innerHTML = goog.dom.getElement('name'+v).innerHTML;
	goog.dom.getElement('sharepopup').style.visibility = 'visible';
	goog.dom.getElement('shareResource_id').value = v;
	goog.dom.getElement('email_notify_share').checked=true;
	goog.dom.getElement('email_notify_msg').checked = false;
	goog.dom.getElement('email_notify_msg').disabled = false;
	goog.dom.getElement('share_message').style.display='none';
}
function hideSharePrompt(){
	goog.dom.getElement('sharepopup').style.visibility = 'hidden';
	goog.dom.getElement('collaborator').value = "";
	goog.dom.getElement('hasAccess').innerHTML = '';
	goog.dom.getElement('email_notify_msg').checked=false;
	goog.dom.getElement('share_message').style.display='none';
	goog.dom.getElement('share_message').innerHTML="";
}
function shareScript(){
	var r = goog.format.EmailAddress.parseList(goog.dom.getElement('collaborator').value)
	var arr=[];
	var nonValidEmail=false;
	for(i in r){
		var a = r[i].address_;
		if(a!=""){
			try{
				var domain = a.split('@')[1].split('.')[0].toLowerCase();
				if(domain=='gmail' || domain=='googlemail' || domain=='rocketmail' || domain=='ymail' || domain=='yahoo'){
					arr.push(a);
				}
				else{nonValidEmail=true}
			}
			catch(err){};
		}
	}
	if(nonValidEmail==true){
		alert('At this time you can only collaborate with Gmail or Yahoo accounts.')
	}
	if(arr.length==0){
		alert('You need to add at least one email address.')
		return;
	}
	var collaborators = arr.join(',');
	var resource_id = goog.dom.getElement('shareResource_id').value;
	var sendEmail = (goog.dom.getElement('email_notify_share').checked==true ? 'y' : 'n');
	var addMsg = (goog.dom.getElement('email_notify_msg').checked==true ? 'y' : 'n');
	var msg = ((sendEmail=='y' && addMsg=='y') ? escape(goog.dom.getElement('share_message').innerHTML) : 'n');
	goog.net.XhrIo.send('/share',
		function(){
			goog.dom.getElement('email_notify_share').checked=true;
			goog.dom.getElement('email_notify_msg').checked=false;
			goog.dom.getElement('email_notify_msg').disabled=false;
			goog.dom.getElement('share_message').innerHTML = "";
			goog.dom.getElement('share_message').style.display='none';
			refreshList(resource_id)
		},
		'POST',
		'resource_id='+resource_id+'&collaborators='+collaborators+'&fromPage=scriptlist&sendEmail='+sendEmail+'&addMsg='+addMsg+'&msg='+msg
	);
	goog.dom.getElement('shareS').disabled = true;
	goog.dom.getElement('shareS').value = "Sending Invites...";
}
function emailNotifyShare(e){
	var el = goog.dom.getElement('email_notify_msg');
	if (e.checked==true){
		el.disabled=false;
	}
	else{
		el.disabled=true;
		goog.dom.getElement('share_message').style.display='none'
		goog.dom.getElement('email_notify_msg').checked=false;
	}
}
function emailNotifyMsg(e){
	var el = goog.dom.getElement('share_message');
	if (e.checked==true){
		el.style.display='block'
	}
	else{
		el.style.display='none'
	}
}