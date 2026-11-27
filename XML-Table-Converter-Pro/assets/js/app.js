const $=id=>document.getElementById(id),tables=new Map();let worker=null,current="",page=1,sort={key:null,dir:1},fileSize=0,visibleColumns=new Map(),columnFilters=new Map(),selectedRows=new Set();
const fmt=n=>n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(1)} MB`;
function setProgress(pct,status,meta){$("progressBar").style.width=pct+"%";$("progressPct").textContent=pct+"%";$("progressStatus").textContent=status;$("progressMeta").textContent=meta}
function showFile(f){$("fileMeta").textContent=f?`${f.name} · ${fmt(f.size)}`:"No file selected";if(f){$("xmlInput").value="";fileSize=f.size}}
$("fileInput").addEventListener("change",e=>{const f=e.target.files[0];if(f){showFile(f);$("xmlInput").value="";window.selectedFile=f}});
$("xmlInput").addEventListener("input",()=>{window.selectedFile=null;$("fileMeta").textContent="Pasted XML"});
["dragenter","dragover"].forEach(n=>$("xmlInput").addEventListener(n,e=>{e.preventDefault();$("xmlInput").classList.add("drag")}));
["dragleave","drop"].forEach(n=>$("xmlInput").addEventListener(n,e=>{e.preventDefault();$("xmlInput").classList.remove("drag")}));
$("xmlInput").addEventListener("drop",e=>{let f=e.dataTransfer.files[0];if(f){window.selectedFile=f;showFile(f)}});
$("sampleBtn").onclick=()=>{$("xmlInput").value=`<?xml version="1.0"?><employees><employee id="0001" active="true"><name>John Smith</name><email>john@example.com</email><department>IT</department><salary>65000</salary></employee><employee id="0002" active="false"><name>Mary Jones</name><email>mary@example.com</email><department>HR</department><salary>55000</salary></employee><employee id="0003" active="true"><name>Sam Lee</name><email>sam@example.com</email><department>Finance</department><salary>72000</salary></employee></employees>`;window.selectedFile=null;$("fileMeta").textContent="Sample XML loaded"};
$("clearBtn").onclick=()=>{$("xmlInput").value="";$("fileInput").value="";window.selectedFile=null;$("fileMeta").textContent="No file selected";$("results").classList.add("hidden")};
$("convertBtn").onclick=async()=>{let f=window.selectedFile;if(!f){let s=$("xmlInput").value;if(!s.trim()){alert("Choose a file or paste XML first.");return}f=new File([s],"pasted.xml",{type:"application/xml"})}tables.clear();current="";$("results").classList.add("hidden");$("progressPanel").classList.remove("hidden");$("convertBtn").disabled=true;fileSize=f.size;worker=new Worker("workers/xml-worker.js");worker.onmessage=e=>{let d=e.data;if(d.type==="rows"){if(!tables.has(d.table))tables.set(d.table,{rows:[],columns:[]});let t=tables.get(d.table);for(let r of d.rows){for(let k of Object.keys(r))if(!t.columns.includes(k))t.columns.push(k);t.rows.push(r)}}else if(d.type==="progress"){setProgress(d.pct,"Converting XML",`${fmt(d.read)} of ${fmt(f.size)} read · ${d.total.toLocaleString()} rows detected`)}else if(d.type==="done"){worker.terminate();worker=null;$("progressPanel").classList.add("hidden");$("convertBtn").disabled=false;renderResults();}else{worker?.terminate();worker=null;$("convertBtn").disabled=false;$("progressStatus").textContent=d.type==="cancelled"?"Cancelled":"Conversion failed";$("progressMeta").textContent=d.message||"Processing stopped";$("progressPct").textContent="";$("progressBar").style.width="0";if(d.type==="error")alert("XML conversion error: "+d.message)}};worker.onerror=e=>{alert("Worker error: "+e.message);worker?.terminate();worker=null;$("convertBtn").disabled=false};worker.postMessage({type:"parse",file:f,batchSize:500})};
$("cancelBtn").onclick=()=>{if(worker){worker.postMessage({type:"cancel"});worker.terminate();worker=null;$("convertBtn").disabled=false;setProgress(0,"Cancelled","Processing stopped by user")}};
function renderResults(){if(!tables.size){alert("No table records were found. Check that the XML contains elements with child elements or attributes.");return}current=[...tables.keys()][0];$("results").classList.remove("hidden");$("rowCount").textContent=[...tables.values()].reduce((a,t)=>a+t.rows.length,0).toLocaleString();$("tableCount").textContent=tables.size;$("sizeStat").textContent=fmt(fileSize);renderTabs();renderTable()}
function renderTabs(){$("tableTabs").innerHTML="";for(let [name,t] of tables){let b=document.createElement("button");b.className="tab"+(name===current?" active":"");b.textContent=name.split("/").filter(Boolean).slice(-2).join(" / ")||name;b.title=name+" · "+t.rows.length+" rows";b.onclick=()=>{current=name;page=1;sort={key:null,dir:1};selectedRows.clear();renderTabs();renderTable()};$("tableTabs").append(b)}}
function visibleRows(){let t=tables.get(current),q=$("searchInput").value.toLowerCase(),filters=columnFilters.get(current)||new Map();let rows=t.rows.filter(r=>(!q||Object.values(r).some(v=>String(v??"").toLowerCase().includes(q)))&&[...filters].every(([k,v])=>!v||String(r[k]??"").toLowerCase().includes(v.toLowerCase())));if(sort.key)rows.sort((a,b)=>String(a[sort.key]??"").localeCompare(String(b[sort.key]??""),undefined,{numeric:false})*sort.dir);return rows}
function renderTable(){
 let activeFilter=document.activeElement?.dataset?.filterKey||null;
 let activePos=activeFilter?document.activeElement.selectionStart:null;
 let t=tables.get(current); if(!t)return;
 let cols=t.columns;
 if(!visibleColumns.has(current))visibleColumns.set(current,new Set(cols));
 let shown=visibleColumns.get(current);
 $("colCount").textContent=shown.size;
 $("thead").innerHTML="";
 let head=document.createElement("tr"),selectTh=document.createElement("th"),selectAll=document.createElement("input");
 selectAll.type="checkbox";selectAll.title="Select all rows on this page";
 selectAll.onchange=()=>{let filtered=visibleRows(),all=$("pageSize").value==="all",size=all?filtered.length:Number($("pageSize").value),rows=filtered.slice((page-1)*size,page*size);rows.forEach(r=>selectAll.checked?selectedRows.add(r):selectedRows.delete(r));renderTable()};
 selectTh.append(selectAll);head.append(selectTh);
 cols.forEach(k=>{
   let th=document.createElement("th");th.dataset.field=k;th.title=k;th.hidden=!shown.has(k);
   let label=document.createElement("span");label.className="column-title";
   label.textContent=k+(sort.key===k?(sort.dir===1?" ↑":" ↓"):"");
   th.append(label);
   th.onclick=(ev)=>{
     if(ev.target?.closest?.(".resize-handle"))return;
     if(Date.now()<Number(th.dataset.skipSortUntil||0))return;
     sort={key:k,dir:sort.key===k?-sort.dir:1};renderTable()
   };
   head.append(th)
 });
 $("thead").append(head);
 // Column chooser and per-column filters
 $("columnMenu").innerHTML="";
 let filters=columnFilters.get(current)||new Map();
 cols.forEach(k=>{
   let wrap=document.createElement("div");wrap.className="column-control";
   let label=document.createElement("label"),check=document.createElement("input");check.type="checkbox";check.checked=shown.has(k);
   check.onchange=()=>{check.checked?shown.add(k):shown.delete(k);renderTable()};
   label.append(check,document.createTextNode(k));wrap.append(label);
   let filter=document.createElement("input");filter.type="search";filter.placeholder="Filter "+k;filter.value=filters.get(k)||"";filter.className="column-filter";filter.dataset.filterKey=k;
   filter.oninput=()=>{filters.set(k,filter.value);columnFilters.set(current,filters);page=1;renderTable()};
   wrap.append(filter);$("columnMenu").append(wrap);
 });
 let rows=visibleRows(),allRows=$("pageSize").value==="all",size=allRows?Math.max(1,rows.length):Number($("pageSize").value),pages=Math.max(1,Math.ceil(rows.length/size));
 page=Math.min(page,pages);let start=(page-1)*size,body=$("tbody");body.innerHTML="";
 rows.slice(start,start+size).forEach(r=>{
   let tr=document.createElement("tr"),sel=document.createElement("td"),cb=document.createElement("input");
   cb.type="checkbox";cb.checked=selectedRows.has(r);cb.title="Select row";
   cb.onchange=()=>{cb.checked?selectedRows.add(r):selectedRows.delete(r);updateSelectedLabel()};
   sel.append(cb);tr.append(sel);
   cols.forEach(k=>{let td=document.createElement("td");td.dataset.field=k;td.textContent=r[k]??"";td.title=r[k]??"";td.hidden=!shown.has(k);tr.append(td)});
   body.append(tr);
 });
 $("rangeLabel").textContent=rows.length?(allRows?`Showing all ${rows.length.toLocaleString()} records`:`${(start+1).toLocaleString()}–${Math.min(start+size,rows.length).toLocaleString()} of ${rows.length.toLocaleString()} records`):"No matching records";
 $("pageLabel").textContent=`${page} / ${pages}`;$("prevBtn").disabled=page<=1;$("nextBtn").disabled=page>=pages;updateSelectedLabel();
 if(activeFilter){let el=[...document.querySelectorAll(".column-filter")].find(x=>x.dataset.filterKey===activeFilter);if(el){el.focus();try{el.setSelectionRange(activePos,activePos)}catch(e){}}}
}
function updateSelectedLabel(){$("selectedLabel").textContent=`${selectedRows.size.toLocaleString()} selected`}
$("searchInput").oninput=()=>{page=1;renderTable()};$("pageSize").onchange=()=>{page=1;renderTable()};$("prevBtn").onclick=()=>{page--;renderTable()};$("nextBtn").onclick=()=>{page++;renderTable()};$("columnsBtn").onclick=()=>$("columnMenu").classList.toggle("hidden");
function download(name,data,type){let blob=new Blob([data],{type}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function csvRows(rows,cols){const q=v=>{let s=String(v??"");return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};return [cols.map(q).join(","),...rows.map(r=>cols.map(k=>q(r[k])).join(","))].join("\r\n")}
$("csvBtn").onclick=()=>{let t=tables.get(current);download("xml-table.csv","\ufeff"+csvRows(t.rows,t.columns),"text/csv;charset=utf-8")};
$("htmlBtn").onclick=()=>{let t=tables.get(current),rows=t.rows,cols=t.columns;let esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));let h="<!doctype html><meta charset=utf-8><title>XML table export</title><style>body{font:14px Arial;padding:24px}table{border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#eef3f4}</style><h2>"+esc(current)+"</h2><table><thead><tr>"+cols.map(k=>"<th>"+esc(k)+"</th>").join("")+"</tr></thead><tbody>"+rows.map(r=>"<tr>"+cols.map(k=>"<td>"+esc(r[k])+"</td>").join("")+"</tr>").join("")+"</tbody></table>";download("xml-table.html",h,"text/html")};

$("xmlBtn").onclick=()=>{
 let t=tables.get(current),rows=[...selectedRows];
 if(!rows.length){alert("Select one or more rows using the checkboxes in the first column.");return}
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
 const tag=n=>{let safe=String(n).replace(/[^A-Za-z0-9_.:-]/g,"_");if(!/^[A-Za-z_]/.test(safe))safe="_"+safe;return safe};
 const cols=t.columns.filter(k=>visibleColumns.get(current)?.has(k));
 const recordTag=tag(current.split("/").filter(Boolean).pop()||"record");
 const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<records source-table="${esc(current)}">\n`+
 rows.map(r=>"  <"+recordTag+">\n"+cols.map(k=>"    <"+tag(k)+">"+esc(r[k])+"</"+tag(k)+">").join("\n")+"\n  </"+recordTag+">").join("\n")+
 "\n</records>\n";
 download("selected-rows.xml",xml,"application/xml;charset=utf-8");
};
// Light/dark appearance preference
function applyTheme(dark){
 document.body.classList.toggle("dark",!!dark);
 const btn=$("themeBtn");
 btn.textContent=dark?"☀ Light":"☾ Dark";
 btn.setAttribute("aria-label",dark?"Switch to light theme":"Switch to dark theme");
 btn.setAttribute("aria-pressed",String(!!dark));
 try{localStorage.setItem("xml-pro-theme-v19",dark?"dark":"light")}catch(e){}
}
let savedTheme=null;
try{savedTheme=localStorage.getItem("xml-pro-theme-v19")}catch(e){}
applyTheme(savedTheme==="dark"); // Default to the supplied light lavender theme.
$("themeBtn").onclick=()=>applyTheme(!document.body.classList.contains("dark"));
// Minimal standards-compliant XLSX writer (OOXML stored in a ZIP container; all values exported as text).
function makeZip(files){const enc=new TextEncoder(),out=[],central=[];let offset=0;const crc32=data=>{let c=~0;for(let b of data){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (~c)>>>0};const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];for(const f of files){let name=enc.encode(f.name),data=enc.encode(f.data),crc=crc32(data),local=[0x50,0x4b,3,4,...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name,...data];out.push(new Uint8Array(local));let c=[0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name];central.push(new Uint8Array(c));offset+=local.length}let cd=central.reduce((a,b)=>a+b.length,0),end=new Uint8Array([0x50,0x4b,5,6,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cd),...u32(offset),...u16(0)]);return new Blob([...out,...central,end],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}
const xmlEsc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
const colName=n=>{let s="";while(n){let r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26)}return s};
$("xlsxBtn").onclick=()=>{let files=[],sheets=[...tables.entries()],sheetNames=sheets.map(([n],i)=>"Table"+(i+1));files.push({name:"[Content_Types].xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`});files.push({name:"_rels/.rels",data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`});files.push({name:"xl/workbook.xml",data:`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((x,i)=>`<sheet name="${sheetNames[i]}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("")}</sheets></workbook>`});files.push({name:"xl/_rels/workbook.xml.rels",data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}</Relationships>`});sheets.forEach(([name,t],i)=>{let rows=[t.columns,...t.rows.map(r=>t.columns.map(k=>r[k]??""))];let sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((r,ri)=>`<row r="${ri+1}">${r.map((v,ci)=>`<c r="${colName(ci+1)}${ri+1}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`).join("")}</row>`).join("")}</sheetData></worksheet>`;files.push({name:`xl/worksheets/sheet${i+1}.xml`,data:sheet})});let blob=makeZip(files),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="xml-tables.xlsx";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};

// v1.2 enhancements
const currentTable=()=>tables.get(current);
const selectedCurrentRows=()=>{const t=currentTable();return t?t.rows.filter(r=>selectedRows.has(r)):[]};
const currentVisibleCols=()=>{const t=currentTable();return t?t.columns.filter(k=>visibleColumns.get(current)?.has(k)):[]};
const xmlEscape=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
const safeXmlTag=n=>{let x=String(n).replace(/[^A-Za-z0-9_.:-]/g,"_");return /^[A-Za-z_]/.test(x)?x:"_"+x};
function selectedXmlText(){let rows=selectedCurrentRows(),cols=currentVisibleCols();if(!rows.length)return "";let tag=safeXmlTag(current.split("/").filter(Boolean).pop()||"record");return `<?xml version="1.0" encoding="UTF-8"?>\n<records source-table="${xmlEscape(current)}">\n`+rows.map(r=>`  <${tag}>\n`+cols.map(k=>`    <${safeXmlTag(k)}>${xmlEscape(r[k])}</${safeXmlTag(k)}>`).join("\n")+"\n  </"+tag+">").join("\n")+"\n</records>\n"}
async function copyText(text,label){if(!text){alert("Select one or more rows first.");return}try{await navigator.clipboard.writeText(text);alert(label+" copied to clipboard.")}catch(e){let ta=document.createElement("textarea");ta.value=text;document.body.append(ta);ta.select();let ok=document.execCommand("copy");ta.remove();alert(ok?label+" copied to clipboard.":"Clipboard access was blocked by the browser.")}}
$("copyXmlBtn").onclick=()=>copyText(selectedXmlText(),"Selected XML");
$("copyCsvBtn").onclick=()=>{let rows=selectedCurrentRows(),cols=currentVisibleCols();copyText(rows.length?csvRows(rows,cols):"","Selected CSV")};
$("copyExcelBtn").onclick=()=>{let rows=selectedCurrentRows(),cols=currentVisibleCols();let tsv=[cols.join("\t"),...rows.map(r=>cols.map(k=>String(r[k]??"").replace(/\t/g," ").replace(/\r?\n/g," ")).join("\t"))].join("\r\n");copyText(rows.length?tsv:"","Excel-compatible tab-separated data")};
$("xmlBtn").onclick=()=>{let xml=selectedXmlText();if(!xml){alert("Select one or more rows first.");return}download("selected-rows.xml",xml,"application/xml;charset=utf-8")};
$("clearFiltersBtn").onclick=()=>{columnFilters.set(current,new Map());$("searchInput").value="";page=1;renderTable()};
$("fitContentBtn").onclick=()=>{let t=currentTable();if(!t)return;let cols=currentVisibleCols();let cg=document.querySelector(".table-wrap table colgroup");if(!cg)return;let widths=columnWidths.get(current)||new Map();columnWidths.set(current,widths);cols.forEach(k=>{let max=Math.max(k.length,...t.rows.slice(0,1500).map(r=>String(r[k]??"").length));let w=Math.min(520,Math.max(85,max*7.2+30));widths.set(k,w);let col=cg.children[t.columns.indexOf(k)+1];if(col)col.style.width=w+"px"})};
$("fitTableBtn").onclick=()=>{let t=currentTable();if(!t)return;let cg=document.querySelector(".table-wrap table colgroup");if(!cg)return;let available=document.querySelector(".table-wrap").clientWidth-48,cols=currentVisibleCols(),w=Math.max(85,Math.floor(available/Math.max(1,cols.length)));let widths=columnWidths.get(current)||new Map();columnWidths.set(current,widths);cols.forEach(k=>{widths.set(k,w);let col=cg.children[t.columns.indexOf(k)+1];if(col)col.style.width=w+"px"})};
const oldRenderTable=renderTable;
const columnWidths=new Map();
let activeColumnResize=null;
function getColumnWidthStore(tableName){
 if(!columnWidths.has(tableName)){
   let saved={};
   try{saved=JSON.parse(localStorage.getItem("xml-pro-column-widths-v110")||"{}")}catch(_){}
   columnWidths.set(tableName,new Map(Object.entries(saved[tableName]||{}).map(([k,v])=>[k,Number(v)]).filter(([,v])=>Number.isFinite(v)&&v>=35&&v<=1200)));
 }
 return columnWidths.get(tableName);
}
function saveColumnWidths(tableName){
 try{
   const all={};
   for(const [name,map] of columnWidths)all[name]=Object.fromEntries(map);
   localStorage.setItem("xml-pro-column-widths-v110",JSON.stringify(all));
 }catch(_){}
}
renderTable=function(){
 oldRenderTable();
 const table=document.querySelector(".table-wrap table");
 if(!table)return;
 const t=currentTable();if(!t)return;
 const widths=getColumnWidthStore(current);
 let cg=table.querySelector("colgroup");
 if(!cg){cg=document.createElement("colgroup");table.insertBefore(cg,table.firstChild)}
 cg.innerHTML="";
 const selectionWidth=42;
 const selectCol=document.createElement("col");selectCol.style.width=selectionWidth+"px";cg.append(selectCol);
 let totalWidth=selectionWidth;
 t.columns.forEach(k=>{
   const col=document.createElement("col");
   const w=widths.get(k)||160;
   col.style.width=w+"px";
   col.style.minWidth="0";
   cg.append(col);
   totalWidth+=w;
 });
 // An explicit pixel width prevents the browser from redistributing fixed column widths on sort/repaint.
 table.style.width=totalWidth+"px";
 table.style.minWidth="100%";
 table.style.maxWidth="none";
 table.style.tableLayout="fixed";
 const ths=[...$("thead").querySelectorAll("th")];
 ths.slice(1).forEach((th,i)=>{
   const key=t.columns[i];
   let handle=th.querySelector(".resize-handle");
   if(!handle){
     handle=document.createElement("span");
     handle.className="resize-handle";
     handle.setAttribute("role","separator");
     handle.setAttribute("aria-orientation","vertical");
     handle.setAttribute("aria-label",`Resize ${key} column`);
     handle.tabIndex=0;
     handle.title=`Drag to resize ${key}`;
     th.append(handle);
   }
   handle.onpointerdown=ev=>{
     if(ev.button!==0 && ev.pointerType==="mouse")return;
     ev.preventDefault();ev.stopPropagation();
     const col=cg.children[i+1];if(!col)return;
     const startX=ev.clientX;
     const startWidth=widths.get(key)||col.getBoundingClientRect().width||160;
     const startTableWidth=totalWidth;
     let moved=false;
     activeColumnResize={handle,th,key,pointerId:ev.pointerId};
     handle.classList.add("dragging");
     try{handle.setPointerCapture(ev.pointerId)}catch(_){}
     const move=e=>{
       if(!activeColumnResize||activeColumnResize.pointerId!==e.pointerId)return;
       const delta=e.clientX-startX;
       if(Math.abs(delta)>1)moved=true;
       if(!moved)return;
       // Permit narrow columns; the header label truncates rather than forcing a content-sized minimum.
       const next=Math.max(35,Math.min(1200,startWidth+delta));
       widths.set(key,next);
       col.style.width=next+"px";
       table.style.width=(startTableWidth+next-startWidth)+"px";
     };
     const finish=e=>{
       if(!activeColumnResize||activeColumnResize.pointerId!==e.pointerId)return;
       handle.classList.remove("dragging");
       try{if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId)}catch(_){}
       handle.removeEventListener("pointermove",move);
       handle.removeEventListener("pointerup",finish);
       handle.removeEventListener("pointercancel",finish);
       activeColumnResize=null;
       if(moved){
         saveColumnWidths(current);
         th.dataset.skipSortUntil=String(Date.now()+500);
         const suppress=e2=>{
           e2.preventDefault();e2.stopPropagation();e2.stopImmediatePropagation();
           th.removeEventListener("click",suppress,true);
         };
         th.addEventListener("click",suppress,true);
         setTimeout(()=>th.removeEventListener("click",suppress,true),550);
       }
     };
     handle.addEventListener("pointermove",move);
     handle.addEventListener("pointerup",finish);
     handle.addEventListener("pointercancel",finish);
   };
   handle.onclick=ev=>{ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation()};
   handle.onkeydown=ev=>{
     if(ev.key!=="ArrowLeft"&&ev.key!=="ArrowRight")return;
     ev.preventDefault();ev.stopPropagation();
     const col=cg.children[i+1],delta=ev.key==="ArrowRight"?10:-10;
     const next=Math.max(35,Math.min(1200,(widths.get(key)||col.getBoundingClientRect().width||160)+delta));
     const old=widths.get(key)||col.getBoundingClientRect().width||160;
     widths.set(key,next);col.style.width=next+"px";table.style.width=(totalWidth+next-old)+"px";saveColumnWidths(current);
   };
 });
};
const originalRenderResults=renderResults;
renderResults=function(){originalRenderResults();if(current&&!columnWidths.has(current))columnWidths.set(current,new Map())};
// Editor line numbers and VS Code-style commands
function refreshLineNumbers(){let n=$("xmlInput").value.split("\n").length;$("lineNumbers").textContent=Array.from({length:n},(_,i)=>i+1).join("\n")}
$("xmlInput").addEventListener("input",refreshLineNumbers);$("xmlInput").addEventListener("scroll",()=>{$("lineNumbers").scrollTop=$("xmlInput").scrollTop});refreshLineNumbers();
$("copyInputBtn").onclick=()=>copyText($("xmlInput").value,"Editor XML");
$("formatXmlBtn").onclick=()=>{let src=$("xmlInput").value.trim();if(!src)return;try{let compact=src.replace(/>\s*</g,"><").replace(/(>)(<)(\/*)/g,"$1\n$2$3"),depth=0,out=[];for(let line of compact.split("\n")){let x=line.trim();if(/^<\//.test(x))depth=Math.max(0,depth-1);out.push("  ".repeat(depth)+x);if(/^<[^!?/][^>]*>$/.test(x)&&!(/\/>$/.test(x)||new RegExp("</"+x.slice(1).split(/[ >]/)[0]+">").test(x)))depth++}$("xmlInput").value=out.join("\n");refreshLineNumbers()}catch(e){alert("Could not format XML: "+e.message)}};
$("validateXmlBtn").onclick=()=>{let src=$("xmlInput").value;if(!src.trim()){alert("Paste XML into the editor first.");return}try{let doc=new DOMParser().parseFromString(src,"application/xml");let err=doc.querySelector("parsererror");alert(err?"XML validation failed: "+err.textContent.slice(0,400):"XML is well-formed.");}catch(e){alert("Validation failed: "+e.message)}};

// v1.3: polished in-app dialogs, grid toggle, shortcuts and selection utilities
function showAppDialog(message,title="XML Table Converter Pro"){const box=$("appDialog");$("dialogTitle").textContent=title;$("dialogMessage").textContent=String(message);box.classList.remove("hidden");$("dialogClose").focus()}
window.alert=(message)=>showAppDialog(message);
$("dialogClose").onclick=()=>$("appDialog").classList.add("hidden");
$("appDialog").addEventListener("click",e=>{if(e.target===$("appDialog"))$("appDialog").classList.add("hidden")});
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("appDialog").classList.add("hidden")});
$("gridToggleBtn").onclick=()=>{let wrap=document.querySelector(".table-wrap"),on=$("gridToggleBtn").getAttribute("aria-pressed")==="true";wrap.classList.toggle("grid-visible",!on);wrap.classList.toggle("grid-hidden",on);$("gridToggleBtn").setAttribute("aria-pressed",String(!on));$("gridToggleBtn").textContent=on?"Show table grid":"Hide table grid";showToast(on?"Table grid hidden.":"Table grid visible.")};
$("clearSelectionBtn").onclick=()=>{selectedRows.clear();renderTable();showToast("Selection cleared.")};
$("copyJsonBtn").onclick=()=>{let rows=selectedCurrentRows();copyText(rows.length?JSON.stringify(rows.map(r=>Object.fromEntries(currentVisibleCols().map(k=>[k,r[k]??""]))),null,2):"","Selected JSON")};
function showToast(message){let n=document.createElement("div");n.className="notice";let i=document.createElement("span");i.className="notice-icon";i.textContent="✓";let t=document.createElement("span");t.textContent=message;let b=document.createElement("button");b.type="button";b.textContent="×";b.onclick=()=>n.remove();n.append(i,t,b);$("noticeHost").append(n);setTimeout(()=>n.remove(),4200)}
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();$("convertBtn").click()}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==="f"){e.preventDefault();$("formatXmlBtn").click()}});

$("shortcutsBtn").onclick=()=>showAppDialog(
"KEYBOARD SHORTCUTS\n\nCtrl + Enter     Convert XML into tables\nCtrl + Shift + F   Format XML in the editor\nEsc                    Close this dialog\n\nTABLE WORKFLOW\n• Click a table tab to switch tables.\n• Click a column heading to sort.\n• Use the first checkbox column to select records.\n• Use Columns to show or hide fields.\n• Drag a column header edge to resize it; resizing does not sort the column.\n• Focus a resize handle and use the left/right arrow keys for precise width changes.\n• Use Clear all filters to reset search and column filters.\n\nCOPY & EXPORT\n• Copy selected JSON / XML / CSV / Excel-compatible TSV from the right side of the table toolbar.\n• Download CSV, XLSX, HTML, or selected XML using the export buttons above the table.\n\nTIP\nThe shortcuts use Ctrl on Windows. On macOS, the browser may map Ctrl shortcuts differently.",
"Keyboard shortcuts & quick guide");

// v1.8 additions: filtered-data actions and faster table workflow.
function filteredRowsForExport(){return typeof visibleRows==="function"?visibleRows():[]}
function filteredCsvText(){const rows=filteredRowsForExport(),cols=currentVisibleCols();return rows.length?csvRows(rows,cols):""}
$("filteredCsvBtn").onclick=()=>{const data=filteredCsvText();if(!data){alert("There are no filtered rows to export.");return}download("filtered-rows.csv","\ufeff"+data,"text/csv;charset=utf-8");showToast("Filtered CSV exported.")};
$("selectFilteredBtn").onclick=()=>{const rows=filteredRowsForExport();if(!rows.length){alert("There are no filtered rows to select.");return}rows.forEach(r=>selectedRows.add(r));renderTable();showToast(`${rows.length.toLocaleString()} filtered rows selected.`)};
$("searchInput").addEventListener("keydown",e=>{if(e.key==="Escape"&&$("searchInput").value){$("searchInput").value="";page=1;renderTable();e.stopPropagation()}});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="f"&&!$("appDialog").classList.contains("hidden"))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="f"){e.preventDefault();if(!$("results").classList.contains("hidden")){$("searchInput").focus();$("searchInput").select()}}});

$("shortcutsBtn").onclick=()=>showAppDialog(
"KEYBOARD SHORTCUTS\n\nCtrl + Enter       Convert XML into tables\nCtrl + Shift + F   Format XML in the editor\nCtrl + F            Focus table search\nEscape              Clear table search (when search is focused) / close dialog\n\nTABLE WORKFLOW\n• Choose 25, 50, 100, 500, or All rows in the page-size selector.\n• Select filtered selects every row matching the current search and column filters.\n• Use Columns to show or hide fields.\n• Click a column heading to sort; drag its right edge to resize.\n• Fit columns to values / Fit table to width adjusts column sizing.\n• Clear all filters resets the global search and all column filters.\n• Show/Hide table grid changes cell borders.\n\nCOPY & EXPORT\n• Copy selected JSON, XML, CSV, or Excel-compatible TSV using the right-aligned copy controls.\n• Export filtered CSV downloads the current filtered result set.\n• Download CSV/XLSX/HTML exports the current table data; XLSX includes all detected tables.\n\nAll processing remains local to this computer.",
"Shortcuts & application guide");
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==="a"){if(!$("results").classList.contains("hidden")){$("selectFilteredBtn").click();e.preventDefault()}}});
