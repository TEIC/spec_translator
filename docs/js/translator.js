var Translator=function(){"use strict";var e={namespaces:{tei:"http://www.tei-c.org/ns/1.0",teieg:"http://www.tei-c.org/ns/Examples",rng:"http://relaxng.org/ns/structure/1.0"},tei:{eg:["<pre>","</pre>"],ptr:['<a href="$rw@target">$@target</a>'],ref:[["[target]",['<a href="$rw@target">',"</a>"]]],graphic:function(e){let t=new Image;return t.src=this.rw(e.getAttribute("url")),e.hasAttribute("width")&&t.setAttribute("width",e.getAttribute("width")),e.hasAttribute("height")&&t.setAttribute("height",e.getAttribute("height")),t},list:[["[type=gloss]",function(e){let t=document.createElement("dl");for(let n of Array.from(e.children))if(n.nodeType==Node.ELEMENT_NODE){if("tei-label"==n.localName){let e=document.createElement("dt");e.innerHTML=n.innerHTML,t.appendChild(e)}if("tei-item"==n.localName){let e=document.createElement("dd");e.innerHTML=n.innerHTML,t.appendChild(e)}}return t}]],note:[["[place=end]",function(e){this.noteIndex?this.noteIndex++:this.noteIndex=1;let t="_note_"+this.noteIndex,n=document.createElement("a");n.setAttribute("id","src"+t),n.setAttribute("href","#"+t),n.innerHTML=this.noteIndex;let i=document.createElement("sup");i.appendChild(n);let a=this.dom.querySelector("ol.notes");a||(a=document.createElement("ol"),a.setAttribute("class","notes"),this.dom.appendChild(a));let r=document.createElement("li");return r.id=t,r.innerHTML=e.innerHTML,a.appendChild(r),i}],["_",["(",")"]]],teiHeader:function(e){this.hideContent(e,!1)},title:[["tei-titlestmt>tei-title",function(e){let t=document.createElement("title");t.innerHTML=e.innerText,document.querySelector("head").appendChild(t)}]],cell:[["[cols]",function(e){e.setAttribute("style","grid-column: "+this.getOrdinality(e)+" / span "+e.getAttribute("cols")+";")}]]},teieg:{egXML:function(e){let t=document.createElement("pre"),n=this.serialize(e,!0).replace(/</g,"&lt;"),i=n.match(/^[\t ]+/);return i&&(n=n.replace(new RegExp("^"+i[0],"mg"),"")),t.innerHTML=n,t}}};function t(e,t=!0){if(e.childNodes.length>0){let n=document.createElement("span");e.appendChild(n),n.setAttribute("hidden",""),n.setAttribute("data-original","");for(let t of Array.from(e.childNodes))if(t!==n){if(t.nodeType===Node.ELEMENT_NODE){t.setAttribute("data-processed","");for(let e of t.querySelectorAll("*"))e.setAttribute("data-processed","")}n.appendChild(e.removeChild(t))}if(t)for(let e of Array.from(n.querySelectorAll("*")))e.hasAttribute("id")&&(e.setAttribute("data-origid",e.getAttribute("id")),e.removeAttribute("id"))}}var n=Object.freeze({__proto__:null,getOrdinality:function(e,t){let n=1,i=e;for(;i&&null!==i.previousElementSibling&&(!t||i.previousElementSibling.localName==t)&&(n++,i=i.previousElementSibling,i.previousElementSibling););return n},copyAndReset:function(e){let t=e=>{let n=e.nodeType===Node.ELEMENT_NODE?document.createElement(e.nodeName):e.cloneNode(!0);if(e.attributes)for(let t of Array.from(e.attributes))"data-processed"!==t.name&&n.setAttribute(t.name,t.value);for(let i of Array.from(e.childNodes))if(i.nodeType==Node.ELEMENT_NODE){if(!e.hasAttribute("data-empty")){if(i.hasAttribute("data-original")){for(let e of Array.from(i.childNodes)){let i=n.appendChild(t(e));i.nodeType===Node.ELEMENT_NODE&&i.hasAttribute("data-origid")&&(i.setAttribute("id",i.getAttribute("data-origid")),i.removeAttribute("data-origid"))}return n}n.appendChild(t(i))}}else n.appendChild(i.cloneNode());return n};return t(e)},first:function(e){return e.replace(/ .*$/,"")},hideContent:t,normalizeURI:function(e){return this.rw(this.first(e))},repeat:function(e,t){let n="";for(let i=0;i<t;i++)n+=e;return n},resolveURI:function(e){let t=this.prefixDefs[e.substring(0,e.indexOf(":"))];return e.replace(new RegExp(t.matchPattern),t.replacementPattern)},getPrefixDef:function(e){return this.prefixDefs[e]},rw:function(e){return e.match(/^(?:http|mailto|file|\/|#).*$/)?e:this.base+this.utilities.first(e)},serialize:function(e,t,n){let i="",a=e=>!/[^\t\n\r ]/.test(e);if(!t&&e.nodeType==Node.ELEMENT_NODE){i+="string"==typeof n&&""!==n?"\n"+n+"<":"<",i+=e.getAttribute("data-origname");let t=e.hasAttribute("data-origatts")?e.getAttribute("data-origatts").split(" "):[];for(let n of Array.from(e.attributes))n.name.startsWith("data-")||["id","lang","class"].includes(n.name)||(i+=" "+t.find((function(e){return e.toLowerCase()==n.name}))+'="'+n.value+'"'),"data-xmlns"==n.name&&(i+=' xmlns="'+n.value+'"');e.childNodes.length>0?i+=">":i+="/>"}for(let r of Array.from(e.childNodes))switch(r.nodeType){case Node.ELEMENT_NODE:i+="string"==typeof n?this.serialize(r,!1,n+"  "):this.serialize(r,!1,n);break;case Node.PROCESSING_INSTRUCTION_NODE:i+="<?"+r.nodeValue+"?>";break;case Node.COMMENT_NODE:i+="\x3c!--"+r.nodeValue+"--\x3e";break;default:if(t&&a(r.nodeValue)&&(i+=r.nodeValue.replace(/^\s*\n/,"")),"string"==typeof n&&a(r.nodeValue))break;i+=r.nodeValue}return!t&&e.childNodes.length>0&&(i+="string"==typeof n?"\n"+n+"</":"</",i+=e.getAttribute("data-origname")+">"),i},unEscapeEntities:function(e){return e.replace(/&gt;/,">").replace(/&quot;/,'"').replace(/&apos;/,"'").replace(/&amp;/,"&")}});function i(e){if(e.namespaces)for(let t of Object.keys(e.namespaces))this.namespaces.has(e.namespaces[t])||Array.from(this.namespaces.values()).includes(t)||this.namespaces.set(e.namespaces[t],t);for(let t of this.namespaces.values())if(e[t])for(let n of Object.keys(e[t]))this.behaviors[`${t}:${n}`]=e[t][n];e.handlers&&console.log("Behavior handlers are no longer used."),e.fallbacks&&console.log("Fallback behaviors are no longer used.")}function a(e,t,n){let i;if(e===Object(e))for(let t of Object.keys(e))this.namespaces.has(e[t])||(this.namespaces.set(e[t],t),i=t);else i=e;this.behaviors[`${i}:${t}`]=n}function r(e,t){let n;if(e===Object(e))for(let t of Object.keys(e))this.namespaces.has(e[t])||(this.namespaces.set(e[t],t),n=t);else n=e;delete this.behaviors[`${n}:${t}`]}function s(){window.customElements?this.define.call(this,this.els):this.fallback.call(this,this.els)}class o{constructor(t){this.options=t||{},this.addBehaviors=i.bind(this),this.addBehavior=a.bind(this),this.applyBehaviors=s.bind(this),this.removeBehavior=r.bind(this),this.utilities={};for(const e of Object.keys(n))["getPrefixDef","rw","resolveURI"].includes(e)?this.utilities[e]=n[e].bind(this):this.utilities[e]=n[e];if(this.els=[],this.namespaces=new Map,this.behaviors={},this.hasStyle=!1,this.prefixDefs=[],this.debug=!0===this.options.debug,this.discardContent=!0===this.options.discardContent,this.options.base)this.base=this.options.base;else try{window&&(this.base=window.location.href.replace(/\/[^\/]*$/,"/"))}catch(e){this.base=""}this.options.omitDefaultBehaviors||this.addBehaviors(e),this.options.ignoreFragmentId&&window&&window.removeEventListener("ceteiceanload",o.restorePosition)}getHTML5(e,t,n){return window&&window.location.href.startsWith(this.base)&&e.indexOf("/")>=0&&(this.base=e.replace(/\/[^\/]*$/,"/")),new Promise((function(t,n){let i=new XMLHttpRequest;i.open("GET",e),i.send(),i.onload=function(){this.status>=200&&this.status<300?t(this.response):n(this.statusText)},i.onerror=function(){n(this.statusText)}})).catch((function(e){console.log("Could not get XML file."),this.debug&&console.log(e)})).then((e=>this.makeHTML5(e,t,n)))}makeHTML5(e,t,n){return this.XML_dom=(new DOMParser).parseFromString(e,"text/xml"),this.domToHTML5(this.XML_dom,t,n)}domToHTML5(e,t,n){this.els=function(e,t){const n=e.documentElement;let i=1,a=function(e){return t.has(e.namespaceURI?e.namespaceURI:"")||t.set(e.namespaceURI,"ns"+i++),t.get(e.namespaceURI?e.namespaceURI:"")+":"+e.localName};const r=new Set(Array.from(n.querySelectorAll("*"),a));return r.add(a(n)),r}(e,this.namespaces);let i=t=>{let a;if(this.namespaces.has(t.namespaceURI?t.namespaceURI:"")){let e=this.namespaces.get(t.namespaceURI?t.namespaceURI:"");a=document.createElement(`${e}-${t.localName}`)}else a=document.importNode(t,!1);for(let e of Array.from(t.attributes))"xmlns"==e.name?a.setAttribute("data-xmlns",e.value):a.setAttribute(e.name,e.value),"xml:id"==e.name&&a.setAttribute("id",e.value),"xml:lang"==e.name&&a.setAttribute("lang",e.value),"rendition"==e.name&&a.setAttribute("class",e.value.replace(/#/g,""));if(a.setAttribute("data-origname",t.localName),t.hasAttributes()&&a.setAttribute("data-origatts",t.getAttributeNames().join(" ")),0==t.childNodes.length&&a.setAttribute("data-empty",""),"head"==t.localName){let n=e.evaluate("count(ancestor::*[tei:head])",t,(function(e){if("tei"==e)return"http://www.tei-c.org/ns/1.0"}),XPathResult.NUMBER_TYPE,null);a.setAttribute("data-level",n.numberValue)}if("tagsDecl"==t.localName){let e=document.createElement("style");for(let n of Array.from(t.childNodes))if(n.nodeType==Node.ELEMENT_NODE&&"rendition"==n.localName&&"css"==n.getAttribute("scheme")){let t="";n.hasAttribute("selector")?(t+=n.getAttribute("selector").replace(/([^#, >]+\w*)/g,"tei-$1").replace(/#tei-/g,"#")+"{\n",t+=n.textContent):(t+="."+n.getAttribute("xml:id")+"{\n",t+=n.textContent),t+="\n}\n",e.appendChild(document.createTextNode(t))}e.childNodes.length>0&&(a.appendChild(e),this.hasStyle=!0)}"prefixDef"==t.localName&&(this.prefixDefs.push(t.getAttribute("ident")),this.prefixDefs[t.getAttribute("ident")]={matchPattern:t.getAttribute("matchPattern"),replacementPattern:t.getAttribute("replacementPattern")});for(let e of Array.from(t.childNodes))e.nodeType==Node.ELEMENT_NODE?a.appendChild(i(e)):a.appendChild(e.cloneNode());return n&&n(a,t),a};if(this.dom=i(e.documentElement),this.utilities.dom=this.dom,this.applyBehaviors(),this.done=!0,!t)return window&&window.dispatchEvent(l),this.dom;t(this.dom,this),window&&window.dispatchEvent(l)}processPage(){var e;this.els=(e=document,Array.from(e.querySelectorAll("*[data-origname]"),(e=>e.localName.replace(/(\w+)-.+/,"$1:")+e.getAttribute("data-origname")))),this.applyBehaviors()}unsetNamespace(e){this.namespaces.delete(e)}setBaseUrl(e){this.base=e}append(e,t){let n=this;if(!t)return function(){if(!this.hasAttribute("data-processed")){let t=e.call(n.utilities,this);t&&!n.childExists(this.firstElementChild,t.nodeName)&&n.appendBasic(this,t)}};{let i=e.call(n.utilities,t);i&&!n.childExists(t.firstElementChild,i.nodeName)&&n.appendBasic(t,i)}}appendBasic(e,n){this.discardContent?e.innerHTML="":t(e,!0),e.appendChild(n)}bName(e){return e.tagName.substring(0,e.tagName.indexOf("-")).toLowerCase()+":"+e.getAttribute("data-origname")}childExists(e,t){return!(!e||e.nodeName!=t)||e&&e.nextElementSibling&&this.childExists(e.nextElementSibling,t)}decorator(e){if(Array.isArray(e)&&!Array.isArray(e[0]))return this.applyDecorator(e);let t=this;return function(n){for(let i of e)if(n.matches(i[0])||"_"===i[0])return Array.isArray(i[1])?t.decorator(i[1]).call(this,n):i[1].call(this,n)}}applyDecorator(e){let t=this;return function(n){let i=[];for(let a=0;a<e.length;a++)i.push(t.template(e[a],n));return t.insert(n,i)}}getFallback(e,t){if(e[t])return e[t]instanceof Function?e[t]:decorator(e[t])}getHandler(e,t){if(e[t])return e[t]instanceof Function?this.append(e[t]):this.append(this.decorator(e[t]))}insert(e,t){let n=document.createElement("span");for(let t of Array.from(e.childNodes))t.nodeType!==Node.ELEMENT_NODE||t.hasAttribute("data-processed")||this.processElement(t);if(t[0].match("<[^>]+>")&&t[1]&&t[1].match("<[^>]+>"))n.innerHTML=t[0]+e.innerHTML+(t[1]?t[1]:"");else{n.innerHTML=t[0],n.setAttribute("data-before",t[0].replace(/<[^>]+>/g,"").length);for(let t of Array.from(e.childNodes))n.appendChild(t.cloneNode(!0));t.length>1&&(n.innerHTML+=t[1],n.setAttribute("data-after",t[1].replace(/<[^>]+>/g,"").length))}return n}processElement(e){if(e.hasAttribute("data-origname")&&!e.hasAttribute("data-processed")){let t=this.getFallback(this.bName(e));t&&(this.append(t,e),e.setAttribute("data-processed",""))}for(let t of Array.from(e.childNodes))t.nodeType===Node.ELEMENT_NODE&&this.processElement(t)}tagName(e){return e.includes(":"),e.replace(/:/,"-").toLowerCase()}template(e,t){let n=e;if(e.search(/\$(\w*)(@([a-zA-Z:]+))/)){let i,a=/\$(\w*)@([a-zA-Z:]+)/g;for(;i=a.exec(e);)n=t.hasAttribute(i[2])?i[1]&&this.utilities[i[1]]?n.replace(i[0],this.utilities[i[1]](t.getAttribute(i[2]))):n.replace(i[0],t.getAttribute(i[2])):n.replace(i[0],"")}return n}define(e){for(let t of e)try{let e=this.getHandler(this.behaviors,t);window.customElements.define(this.tagName(t),class extends HTMLElement{constructor(){super(),this.matches(":defined")||(e&&e.call(this),this.setAttribute("data-processed",""))}connectedCallback(){this.hasAttribute("data-processed")||(e&&e.call(this),this.setAttribute("data-processed",""))}})}catch(e){this.debug&&(console.log(tagName(t)+" couldn't be registered or is already registered."),console.log(e))}}fallback(e){for(let t of e){let e=getFallback(this.behaviors,t);if(e)for(let n of Array.from((this.dom&&!this.done?this.dom:document).getElementsByTagName(tagName(t))))n.hasAttribute("data-processed")||append(e,n)}}static savePosition(){window.sessionStorage.setItem(window.location+"-scroll",window.scrollY)}static restorePosition(){if(window.location.hash)setTimeout((function(){let e=document.querySelector(window.decodeURI(window.location.hash));e&&e.scrollIntoView()}),100);else{let e;(e=window.sessionStorage.getItem(window.location+"-scroll"))&&setTimeout((function(){window.scrollTo(0,e)}),100)}}}try{if(window){window.CETEI=o,window.addEventListener("beforeunload",o.savePosition);var l=new Event("ceteiceanload");window.addEventListener("ceteiceanload",o.restorePosition)}}catch(e){console.log(e)}class c{constructor(e={}){e.noCETEI||(this.ct=new o,this.ct.addBehaviors(c.behaviors))}loggedIn(){return window.sessionStorage.getItem("user")}async getCurrentUser(){return(await fetch("https://api.github.com/user",{headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")}})).json()}async userExists(e){return(await fetch(`https://api.github.com/users/${e}`,{headers:{Accept:"application/vnd.github.v3+json"}})).json()}async orgExists(e){return(await fetch(`https://api.github.com/orgs/${e}`,{headers:{Accept:"application/vnd.github.v3+json"}})).json()}async checkOwner(e){if((await this.orgExists(e)).login){return!!await this.checkMembership(window.sessionStorage.getItem("user"),e)&&"organization"}return!!(await this.userExists(e)).login&&"user"}async checkMembership(e,t){return 204==(await fetch(`https://api.github.com/orgs/${t}/members/${e}`,{headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")}})).status}async getRepos(e,t){return(await fetch("https://api.github.com/graphql",{method:"POST",headers:{Authorization:"token "+window.sessionStorage.getItem("token")},body:`{\t"query": "query {repositoryOwner(login:\\"${e}\\") {repositories(first: 100, isFork: true${t}) {pageInfo {startCursor, hasNextPage, endCursor}, totalCount,nodes {name parent {nameWithOwner}}}}}"}`})).json()}async getBranch(e,t,n){return(await fetch(`https://api.github.com/repos/${e}/${t}/branches/${n}`,{headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")}})).json()}async createRef(e,t){const n=window.sessionStorage.getItem("owner"),i=window.sessionStorage.getItem("repo");return(await fetch(`https://api.github.com/repos/${n}/${i}/git/refs`,{method:"POST",headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")},body:`{"ref":"refs/heads/${e}", "sha":"${t}"}`})).json()}async updateRef(e,t){const n=window.sessionStorage.getItem("owner"),i=window.sessionStorage.getItem("repo");return(await fetch(`https://api.github.com/repos/${n}/${i}/git/refs/heads/${e}`,{method:"PATCH",headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")},body:`{"sha":"${t}"}`})).json()}async getCollaborators(e,t){return(await fetch(`https://api.github.com/repos/${e}/${t}/collaborators`,{headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")}})).json()}async forkTEIRepo(e){const t=e?`"organization": "${e}"`:"";return(await fetch("https://api.github.com/repos/TEIC/TEI/forks",{method:"POST",headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")},body:`{${t}}`})).json()}async mergeUpstream(e,t){return(await fetch(`https://api.github.com/repos/${e}/${t}/merge-upstream`,{method:"POST",headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")},body:'{"branch":"dev"}'})).json()}async getBranches(e,t){return(await fetch(`https://api.github.com/repos/${e}/${t}/branches`,{headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")}})).json()}getUniqueRepoBranches(e,t){return this.getBranches("TEIC","TEI").then((n=>{const i=n.map((e=>e.name));return this.getBranches(e,t).then((e=>e.filter((e=>!i.includes(e.name)))))}))}async getTEIRepo(e,t=[],n=""){const i=await this.getRepos(e,n);return t.push(...i.data.repositoryOwner.repositories.nodes.filter((e=>"TEIC/TEI"==e.parent.nameWithOwner))),i.data.repositoryOwner.repositories.pageInfo.hasNextPage?this.geTEIRepo(e,t,`,after:"${i.data.repositoryOwner.repositories.pageInfo.endCursor}")`):t[0]}async verifyTEIRepo(e,t){return(await fetch("https://api.github.com/graphql",{method:"POST",headers:{Authorization:"token "+window.sessionStorage.getItem("token")}})).json()}async getPRForBranch(e,t){return(await fetch(`https://api.github.com/repos/TEIC/TEI/pulls?head=${e}:${t}`,{headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")}})).json()}async createBlob(e){const t=window.sessionStorage.getItem("owner"),n=window.sessionStorage.getItem("repo");try{return(await fetch(`https://api.github.com/repos/${t}/${n}/git/blobs`,{method:"POST",headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")},body:`{"content":${JSON.stringify(e)}, "encoding":"utf-8"}`})).json()}catch(e){return console.log(e),{message:"Exception thrown"}}}async getCommit(e,t,n){return(await fetch(`https://api.github.com/repos/${e}/${t}/git/commits/${n}`,{headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")}})).json()}async getTree(e,t,n){return(await fetch(`https://api.github.com/repos/${e}/${t}/git/trees/${n}?recursive=true`,{headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")}})).json()}async createTree(e,t,n,i){const a=window.sessionStorage.getItem("owner"),r=window.sessionStorage.getItem("repo"),s=i?"100644":"040000",o=i?"blob":"tree";try{return(await fetch(`https://api.github.com/repos/${a}/${r}/git/trees`,{method:"POST",headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")},body:`{"tree":[{"path":"${t}", "mode":"${s}", "type":"${o}", "sha":"${n}"}], "base_tree":"${e}"}`})).json()}catch(e){return console.log(e),{message:"Exception thrown"}}}async createCommit(e,t,n){const i=window.sessionStorage.getItem("owner"),a=window.sessionStorage.getItem("repo");try{return(await fetch(`https://api.github.com/repos/${i}/${a}/git/commits`,{method:"POST",headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")},body:`{"message":"${e}", "tree":"${t}", "parents":["${n}"]}`})).json()}catch(e){return console.log(e),{message:"Exception thrown"}}}async commit(e,t,n){const i=window.sessionStorage.getItem("owner"),a=window.sessionStorage.getItem("repo"),r=window.sessionStorage.getItem("branch"),s=await this.getBranch(i,a,r),o=s.commit.sha,l=await this.createBlob(t),c=await this.getTree(i,a,s.commit.commit.tree.sha),d=c.tree.find((e=>"P5/Source/Specs"==e.path)).sha,h=await this.createTree(d,e,l.sha,!0),u=c.tree.find((e=>"P5/Source"==e.path)).sha,p=await this.createTree(u,"Specs",h.sha,!1),m=c.tree.find((e=>"P5"==e.path)).sha,g=await this.createTree(m,"Source",p.sha,!1),f=await this.createTree(s.commit.commit.tree.sha,"P5",g.sha,!1),b=await this.createCommit(n,f.sha,o);return await this.updateRef(r,b.sha)}async createPullRequest(e){const t=window.sessionStorage.getItem("owner"),n=window.sessionStorage.getItem("branch");return(await fetch("https://api.github.com/repos/TEIC/TEI/pulls",{method:"POST",headers:{Accept:"application/vnd.github.v3+json",Authorization:"token "+window.sessionStorage.getItem("token")},body:`{"head":"${t}:${n}", "base":"dev", "title":"${e}"}`})).json()}conv(e,t="en"){return i18n.entries[e]&&i18n.entries[e][t]?i18n.entries[e][t]:e}teiParent(e){for(;e&&!e.tagName.match(/^TEI-/);)return this.teiParent(e.parentElement);return e}teiParents(e,t=[]){let n=e&&e.parentElement?this.teiParent(e.parentElement):null;return n?(t.push(n),this.teiParents(n,t)):t}getTEIXPath(e){let t="/";return t+=this.teiParents(e).reverse().map((e=>{let t="tei:"+e.getAttribute("data-origname");return e.localName,e.hasAttribute("lang")&&(t+="[@xml:lang='"+e.getAttribute("lang")+"']"),t})).join("/"),t}resolveNS(e){switch(e){case"tei":return"http://www.tei-c.org/ns/1.0";case"xml":return"http://www.w3.org/XML/1998/namespace";default:return""}}toTEI(e,t){let n=e.createElementNS("http://www.tei-c.org/ns/1.0",t.getAttribute("data-origname"));return Array.from(t.attributes).forEach((e=>{e.name.startsWith("data-")||"lang"==e.name||n.setAttribute(e.name,e.value)})),n.innerHTML=t.querySelector("textarea").value,n}updateSource(e,t){let n=this.getTEIXPath(t),i=e.evaluate(n,e,this.resolveNS,XPathResult.FIRST_ORDERED_NODE_TYPE,null);if(i.singleNodeValue)i.singleNodeValue.innerHTML=t.value,i.singleNodeValue.setAttribute("versionDate",(new Date).toISOString().substring(0,10));else{n=n.replace(/@xml:lang='(..)'/,"@xml:lang='en'"),i=e.evaluate(n,e,this.resolveNS,XPathResult.FIRST_ORDERED_NODE_TYPE,null);let a=i.singleNodeValue;if(a.previousSibling.nodeType===Node.TEXT_NODE){let n=a.previousSibling.nodeValue.replace(/.*(\w+)$/,"$1");a.insertAdjacentElement("afterend",this.toTEI(e,this.teiParent(t))).insertAdjacentText("beforebegin",n)}else a.insertAdjacentElement("afterend",this.toTEI(e,this.teiParent(t)))}return e}saveToXML(e){e.forEach((e=>e.save())),document.querySelectorAll("textarea.translate").forEach((e=>{this.updateSource(this.ct.XML_dom,e)}))}content(){return(new XMLSerializer).serializeToString(this.ct.XML_dom)}static behaviors={tei:{attDef:function(e){let t=document.createElement("dl"),n=document.createElement("dt");n.innerText="@"+e.getAttribute("ident");let i=document.createElement("dd");for(let t=0;t<e.childNodes.length;t++)i.appendChild(e.childNodes[t].cloneNode(!0));if(e.hasAttribute("usage")){let t=document.createElement("dl");t.innerHTML='<dt><span class="i18n">Status</span></dt><dd>'+attstatus[e.getAttribute("usage")]+"</dd>",i.appendChild(t)}return t.appendChild(n),t.appendChild(i),t},attList:function(e){let t=document.createElement("dl"),n=document.createElement("dt"),i=document.createElement("dd");n.innerText="Attributes";for(let t=0;t<e.childNodes.length;t++)i.appendChild(e.childNodes[t].cloneNode(!0));return t.appendChild(n),t.appendChild(i),t},content:function(e){let t=document.createElement("dl");return t.innerHTML='<dt><span class="i18n">Content model</span></dt><dd><pre>'+this.serialize(e.querySelector("*"),!1,"").replace(/</g,"&lt;")+"</pre></dd>",t},dataRef:['<a href="$@key">$@key</a>'],datatype:[["[minoccurs][maxoccurs]",function(e){let t=document.createElement("dl");t.innerHTML='<dt><span class="i18n">Datatype</sapn></dt>';let n=document.createElement("dd");return n.appendChild(document.createTextNode(getAttribute("minoccurs")+"–"+("unbounded"==e.getAttribute("maxoccurs")?"∞":e.getAttribute("maxoccurs"))+" of ")),n.appendChild(e.querySelector("tei-dataref").cloneNode()),("unbounded"==e.getAttribute("maxoccurs")||parseInt(e.getAttribute("maxoccurs"),10)>1)&&n.appendChild(document.createTextNode(" separated by whitespace")),t.appendChild(n),t}],["[maxoccurs]",function(e){let t=document.createElement("dl");t.innerHTML='<dt><span class="i18n">Datatype</span></dt>';let n=document.createElement("dd");return n.appendChild(document.createTextNode("1–"+("unbounded"==e.getAttribute("maxoccurs")?"∞":e.getAttribute("maxoccurs"))+" of ")),n.appendChild(e.querySelector("tei-dataref").cloneNode()),("unbounded"==e.getAttribute("maxoccurs")||parseInt(e.getAttribute("maxoccurs"),10)>1)&&n.appendChild(document.createTextNode(" separated by whitespace")),t.appendChild(n),t}],["*",function(e){let t=document.createElement("dl");t.innerHTML='<dt><span class="i18n">Datatype</span></dt>';let n=document.createElement("dd");return n.appendChild(e.querySelector("tei-dataref").cloneNode()),t.appendChild(n),t}]],desc:[["cetei-translate>tei-desc",function(e){let t=document.createElement("form");return t.innerHTML='<textarea class="translate">'+this.serialize(e,!0).replace(/^( |\t)+/gm,"")+"</textarea>",t}],["*[lang=en]",['<span class="translatable">',"</span>"]]],elementSpec:function(e){let t=document.createDocumentFragment(),n=document.createElement("h1");n.innerText="<"+e.getAttribute("ident")+">",t.appendChild(n);let i=e.querySelectorAll("tei-elementspec>tei-gloss");for(let e=0;e<i.length;e++)t.appendChild(i[e].cloneNode(!0));let a=e.querySelectorAll("tei-elementspec>tei-desc");for(let e=0;e<a.length;e++)t.appendChild(a[e].cloneNode(!0));let r=document.createElement("dl"),s=document.createElement("dt"),o=document.createElement("dd");s.innerHTML='<span class="i18n">Module</span>',o.innerText=e.getAttribute("module"),r.appendChild(s),r.appendChild(o),t.appendChild(r);let l=e.querySelector("tei-attlist");l&&t.appendChild(l.cloneNode(!0));let c=e.querySelectorAll("tei-exemplum");for(let e=0;e<c.length;e++)t.appendChild(c[e].cloneNode(!0));let d=e.querySelector("tei-exemplum>tei-remarks");return d&&t.appendChild(d.cloneNode(!0)),t.appendChild(e.querySelector("tei-content").cloneNode(!0)),t},exemplum:["<dl><dt>Example</dt><dd>","</dd></dl>"],gloss:[["cetei-translate>tei-gloss",function(e){let t=document.createElement("form");return t.innerHTML='<textarea class="translate">'+this.serialize(e,!0).replace(/^( |\t)+/gm,"")+"</textarea>",t}],["*[lang=en]",['<summary class="translatable">',"</summary> "]]],remarks:[["cetei-translate>tei-remarks",function(e){let t=document.createElement("form");return t.innerHTML='<textarea class="code translate">'+this.serialize(e,!0).replace(/^( |\t)+/gm,"")+"</textarea>",t}],["*[lang=en]",function(e){let t=document.createElement("dl");return t.innerHTML='<dt><span class="i18n">Notes</span></dt><dd class="translatable">'+e.innerHTML+"</dd>",t}]]}}}return c}();
