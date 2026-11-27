let cancelled=false;
self.onmessage=async e=>{if(e.data.type==="cancel"){cancelled=true;return} if(e.data.type!=="parse")return;cancelled=false;
 const file=e.data.file, batchSize=Number(e.data.batchSize)||500;let total=0, sent=0, buffers=new Map(), counts=new Map(), stack=[], batchMap=new Map(), error=null;
 const emit=(table,row)=>{let b=batchMap.get(table);if(!b){b=[];batchMap.set(table,b)}b.push(row);total++;if(b.length>=batchSize)flush(table)};
 const flush=table=>{let rows=batchMap.get(table);if(rows?.length){self.postMessage({type:"rows",table,rows});sent+=rows.length;batchMap.set(table,[])}};
 const decode=s=>s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(m,x)=>{let k=x.toLowerCase();if(k==="amp")return"&";if(k==="lt")return"<";if(k==="gt")return">";if(k==="quot")return'"';if(k==="apos")return"'";try{return k.startsWith("#x")?String.fromCodePoint(parseInt(k.slice(2),16)):String.fromCodePoint(parseInt(k.slice(1),10))}catch{return m}});
 const local=n=>n.split(":").pop();
 const addText=(node,t)=>{if(t)node.text+=decode(t)};
 const makeRow=node=>{let row={};for(const [k,v] of Object.entries(node.attrs))row["@"+k]=v;for(const c of node.children){if(c.children.length){let val=c.text.trim();if(val)row[c.name]=row[c.name]===undefined?val:String(row[c.name])+" | "+val}else{let val=c.text;if(row[c.name]===undefined)row[c.name]=val;else row[c.name]=String(row[c.name])+" | "+val}}if(!Object.keys(row).length&&node.text)row["#text"]=node.text;return row};
 const parseTag=raw=>{let s=raw.trim(),closing=s[0]==="/",selfclose=s.endsWith("/");if(closing)return {closing:true,name:s.slice(1).trim()};let m=s.match(/^([^\s/>]+)/);if(!m)throw Error("Invalid XML tag");let name=m[1],attrs={},rest=s.slice(m[0].length);let re=/([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g,a;while((a=re.exec(rest)))attrs[a[1]]=decode(a[3]??a[4]??"");return {name,attrs,selfclose}};
 const reader=file.stream().getReader(),decoder=new TextDecoder();let buf="",read=0,lastProgress=0;
 function process(final=false){let i=0;while(i<buf.length){if(cancelled)throw Error("__CANCEL__");let lt=buf.indexOf("<",i);if(lt<0){if(final){if(stack.length)addText(stack.at(-1),buf.slice(i));i=buf.length}else{if(stack.length)addText(stack.at(-1),buf.slice(i));i=buf.length}break}
 if(lt>i&&stack.length)addText(stack.at(-1),buf.slice(i,lt));
 if(buf.startsWith("<!--",lt)){let z=buf.indexOf("-->",lt+4);if(z<0)break;i=z+3;continue}
 if(buf.startsWith("<![CDATA[",lt)){let z=buf.indexOf("]]>",lt+9);if(z<0)break;if(stack.length)stack.at(-1).text+=buf.slice(lt+9,z);i=z+3;continue}
 if(buf.startsWith("<?",lt)){let z=buf.indexOf("?>",lt+2);if(z<0)break;i=z+2;continue}
 if(/^<!DOCTYPE/i.test(buf.slice(lt,lt+10))){let z=buf.indexOf(">",lt+2);if(z<0)break;i=z+1;continue}
 let q=null,z=lt+1;for(;z<buf.length;z++){let ch=buf[z];if(q){if(ch===q)q=null}else if(ch==='"'||ch==="'")q=ch;else if(ch===">")break}if(z>=buf.length)break;
 let raw=buf.slice(lt+1,z),tag=parseTag(raw);
 if(tag.closing){if(!stack.length)throw Error("Unexpected closing tag </"+tag.name+">");let node=stack.pop();if(node.name!==tag.name)throw Error("Mismatched closing tag: expected </"+node.name+"> but found </"+tag.name+">");let path=node.path;let row=makeRow(node);if(node.children.length||Object.keys(node.attrs).length){emit(path,row)}
 if(stack.length){let p=stack.at(-1);p.children.push(node)}}
 else if(!tag.selfclose){let parent=stack.at(-1),path=(parent?parent.path+"/":"")+tag.name;stack.push({name:tag.name,path,attrs:tag.attrs,text:"",children:[]})}
 else {let parent=stack.at(-1),path=(parent?parent.path+"/":"")+tag.name;emit(path,{...Object.fromEntries(Object.entries(tag.attrs).map(([k,v])=>["@"+k,v]))})}
 i=z+1;
 }buf=buf.slice(i)}
 try{while(true){let {value,done}=await reader.read();if(cancelled)throw Error("__CANCEL__");if(done)break;buf+=decoder.decode(value,{stream:true});read+=value.byteLength;process();let pct=Math.min(99,Math.floor(read/file.size*100));if(pct!==lastProgress){lastProgress=pct;self.postMessage({type:"progress",pct,read,total})}}
 buf+=decoder.decode();process(true);if(stack.length)throw Error("Unclosed XML element <"+stack.at(-1).name+">");for(const k of batchMap.keys())flush(k);self.postMessage({type:"done",total,bytes:read})}
 catch(err){error=err.message;self.postMessage({type:cancelled||error==="__CANCEL__"?"cancelled":"error",message:error})}
 finally{reader.releaseLock?.()}
};