import CETEI from "CETEIcean"

class Translator {

  constructor(options = {}) {
    if (!options.noCETEI) {
      this.ct = new CETEI();
      this.ct.addBehaviors(Translator.behaviors);
    }

  }
  loggedIn() {
    return window.sessionStorage.getItem("user");
  }
  async getCurrentUser() {
    const response = await fetch('https://api.github.com/user',
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      }});
    const json = await response.json();
    return json;
  }
  async userExists(login) {
    try {
      const response = await fetch(`https://api.github.com/users/${login}`,
        { headers: {
          'Accept': 'application/vnd.github.v3+json',
        }});
      const json = await response.json();
      return json.login;
    }
    catch(error) {
      return null;
    }
    
  }
  async orgExists(login) {
    try {
      const response = await fetch(`https://api.github.com/orgs/${login}`,
        { headers: {
          'Accept': 'application/vnd.github.v3+json',
        }});
      const json = await response.json();
      return json.login;
    }
    catch(error) {
      return null;
    }
  }
  async checkOwner(owner) {
    const isUser = await this.userExists(owner);
    if (isUser) {
      return 'user';
    }
    const isOrg = await this.orgExists(owner);
    if (isOrg) {
      return 'organization';
    }
    return false;
  }
  async getRepos(owner, page) {
    const response = await fetch('https://api.github.com/graphql', { 
      method: 'POST',
      headers: {
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      },
      body: `{	"query": "query {repositoryOwner(login:\\"${owner}\\") {repositories(first: 100, isFork: true${page}) {pageInfo {startCursor, hasNextPage, endCursor}, totalCount,nodes {name parent {nameWithOwner}}}}}"}`
    });
    const json = await response.json();
    return json;
  }
  async getBranch(owner, repo, branch) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token'),
      }});
    const json = await response.json();
    return json;
  }
  async createRef(owner, repo, ref, sha) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token'),
      },
      body: `{"ref":"refs/heads/${ref}", "sha":"${sha}"}`
    });
    const json = await response.json();
    return json;
  }
  async getCollaborators(owner, repo) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators`,
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token'),
      }});
    const json = await response.json();
    return json;
  }
  async forkTEIRepo(organization) {
    const body = organization ? `"organization": "${organization}"` : '';
    const response = await fetch(`https://api.github.com/repos/TEIC/TEI/forks`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token'),
      },
      body: `{${body}}`
    });
    const json = await response.json();
    return json;
  }
  async getBranches(owner, repo) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`,
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      }});
    const json = await response.json();
    return json;
  }
  getUniqueRepoBranches(owner, repo) {
    const result = this.getBranches('TEIC','TEI').then(TEIBranches => {
      const names = TEIBranches.map(b => b.name);
      const uniqueBranches = this.getBranches(owner, repo).then(branches => {
        return branches.filter(branch => !names.includes(branch.name));
      });
      return uniqueBranches;
    });
    return result;
  }
  async getTEIRepos(owner, acc = [], page = '') {
    const json = await this.getRepos(owner, page);
    acc.push(...json.data.repositoryOwner.repositories.nodes.filter(repo => repo.parent.nameWithOwner == 'TEIC/TEI'));
    if (json.data.repositoryOwner.repositories.pageInfo.hasNextPage) {
      return this.geTEIRepos(acc, `,after:"${json.data.repositoryOwner.repositories.pageInfo.endCursor}")`);
    } else {
      return acc;
    }
  }
  async verifyTEIRepo(owner, name) {
    const data = `{\n query { \n repository(owner:"${owner}", name"${name}") \n parent {\n nameWithOwner\n }\n }\n }`;
    const response = await fetch('https://api.github.com/graphql', { 
      method: 'POST',
      headers: {
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
    }});
    const json = await response.json();
    return json;
  }

  conv(key, lang="en") {
    if (i18n.entries[key] && i18n.entries[key][lang]) {
      return i18n.entries[key][lang];
    } else {
      return key;
    }
  }
  teiParent(elt) {
    while (elt && !elt.tagName.match(/^TEI-/)) {
      return this.teiParent(elt.parentElement);
    }
    return elt;
  }
  teiParents(elt, acc = []) {
    let parent = elt && elt.parentElement ? teiParent(elt.parentElement) : null;
    if (parent) {
      acc.push(parent);
      return this.teiParents(parent, acc);
    } else {
      return acc;
    }
  }
  getTEIXPath(elt) {
    let path = "/";
    path += this.teiParents(elt).reverse().map(e => {
      let result = "tei:" + e.getAttribute("data-origname"); 
      if (e.localName == "tei-exemplum") {

      }
      if (e.hasAttribute("lang")){ 
        result += "[@xml:lang='" + e.getAttribute("lang") + "']"
      }; 
      return result;
    }).join("/");
    return path;
  }
  resolveNS(prefix) {
    switch (prefix) {
      case 'tei':
        return 'http://www.tei-c.org/ns/1.0';
      case 'xml':
        return 'http://www.w3.org/XML/1998/namespace';
      default:
        return '';
    }
  }
  toTEI(doc, elt) {
    let e = doc.createElementNS('http://www.tei-c.org/ns/1.0', elt.getAttribute("data-origname"));
    Array.from(elt.attributes).forEach(att => {
      if (!att.name.startsWith("data-") && att.name != 'lang') {
        e.setAttribute(att.name, att.value);
      }
    });
    e.innerHTML = elt.querySelector("textarea").value;
    return e;
  }
  updateSource(doc, elt) {
    let xpath = this.getTEIXPath(elt);
    let result = doc.evaluate(xpath, doc, resolveNS, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    if (result.singleNodeValue) {
      result.singleNodeValue.innerHTML = elt.value;
      result.singleNodeValue.setAttribute('versionDate', (new Date()).toISOString().substring(0,10));
    } else {
      xpath = xpath.replace(/@xml:lang='(..)'/, "@xml:lang='en'");
      result = doc.evaluate(xpath, doc, resolveNS, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      let enElt = result.singleNodeValue;
      // match indent level of the translated element, if any
      if (enElt.previousSibling.nodeType === Node.TEXT_NODE) {
        let ws = enElt.previousSibling.nodeValue.replace(/.*(\w+)$/, "$1");
        enElt.insertAdjacentElement('afterend', toTEI(doc, teiParent(elt)))
          .insertAdjacentText('beforebegin', ws);
      } else {
        enElt.insertAdjacentElement('afterend', toTEI(doc, teiParent(elt)));
      }          
    }
    return doc;
  }
  saveToXML(codemirrors) {
    codemirrors.forEach(cm => cm.save());
    document.querySelectorAll("textarea.translate").forEach(text => {
      this.updateSource(this.ct.XML_dom, text);
    });
  }
  
  
  normalize(str) {
    return str.replace(/^( |\t)+/gm, "");
  }

  static behaviors = {
    "tei": {
      "attDef": function(elt) {
        let result = document.createElement("dl");
        let dt = document.createElement("dt");
        dt.innerText = "@" + elt.getAttribute("ident");
        let dd = document.createElement("dd");
        for (let i =0; i < elt.childNodes.length; i++) {
          dd.appendChild(elt.childNodes[i].cloneNode(true));
        }
        if (elt.hasAttribute("usage")) {
          let dl = document.createElement("dl");
          dl.innerHTML = '<dt><span class=\"i18n\">Status</span></dt>'
            + '<dd>' + attstatus[elt.getAttribute("usage")] + '</dd>';
          dd.appendChild(dl);
        }
        result.appendChild(dt);
        result.appendChild(dd);
        return result;
      },
      "attList": function(elt) {
        let result = document.createElement("dl");
        let dt = document.createElement("dt");
        let dd = document.createElement("dd");
        dt.innerText = "Attributes";
        for (let i =0; i < elt.childNodes.length; i++) {
          dd.appendChild(elt.childNodes[i].cloneNode(true));
        }
        result.appendChild(dt);
        result.appendChild(dd);
        return result;
      },
      "content": function(elt) {
        let result = document.createElement("dl");
        result.innerHTML = "<dt><span class=\"i18n\">Content model</span></dt><dd><pre>" + this.serialize(elt.querySelector("*"), false, "").replace(/</g, "&lt;") + "</pre></dd>";
        return result;
      },
      "dataRef": ["<a href=\"$@key\">$@key</a>"],
      "datatype": [
        ["[minoccurs][maxoccurs]", function(elt) {
          let result = document.createElement("dl");
          result.innerHTML = "<dt><span class=\"i18n\">Datatype</sapn></dt>";
          let dd = document.createElement("dd");
          dd.appendChild(document.createTextNode(getAttribute("minoccurs") + '–' 
            + (elt.getAttribute("maxoccurs") == 'unbounded' ? '∞' : elt.getAttribute("maxoccurs")) 
            + ' of '));
          dd.appendChild(elt.querySelector("tei-dataref").cloneNode());
          if (elt.getAttribute("maxoccurs") == "unbounded" || parseInt(elt.getAttribute("maxoccurs"), 10) > 1) {
            dd.appendChild(document.createTextNode(" separated by whitespace"));
          }
          result.appendChild(dd);
          return result;
        }],
        ["[maxoccurs]", function(elt) {
          let result = document.createElement("dl");
          result.innerHTML = "<dt><span class=\"i18n\">Datatype</span></dt>";
          let dd = document.createElement("dd");
          dd.appendChild(document.createTextNode('1–' 
            + (elt.getAttribute("maxoccurs") == 'unbounded' ? '∞' : elt.getAttribute("maxoccurs")) 
            + ' of '));
          dd.appendChild(elt.querySelector("tei-dataref").cloneNode());
          if (elt.getAttribute("maxoccurs") == "unbounded" || parseInt(elt.getAttribute("maxoccurs"), 10) > 1) {
            dd.appendChild(document.createTextNode(" separated by whitespace"));
          }
          result.appendChild(dd);
          return result;
        }],
        ["*", function(elt) {
          let result = document.createElement("dl");
          result.innerHTML = "<dt><span class=\"i18n\">Datatype</span></dt>";
          let dd = document.createElement("dd");
          dd.appendChild(elt.querySelector("tei-dataref").cloneNode());
          result.appendChild(dd);
          return result;
        }]
      ],
      "desc": [
        ["cetei-translate>tei-desc", function(elt){
          let result = document.createElement("form");
          result.innerHTML = "<textarea class=\"translate\">" + normalize(this.serialize(elt, true)) + "</textarea>";
          return result;
        }],
        ["*[lang=en]", ["<span class=\"translatable\">","</span>"]]
      ],
      "elementSpec": function(elt) {
        let result = document.createDocumentFragment();
        let header = document.createElement("h1");
        header.innerText = "<" + elt.getAttribute("ident") + ">";
        result.appendChild(header);
        let glosses = elt.querySelectorAll("tei-elementspec>tei-gloss");
        for (let i =0; i < glosses.length; i++) {
          result.appendChild(glosses[i].cloneNode(true));
        }
        let descs = elt.querySelectorAll("tei-elementspec>tei-desc");
        for (let i =0; i < descs.length; i++) {
          result.appendChild(descs[i].cloneNode(true));
        }
        let dl = document.createElement("dl");
        let dt = document.createElement("dt");
        let dd = document.createElement("dd");
        dt.innerHTML = "<span class=\"i18n\">Module</span>";
        dd.innerText = elt.getAttribute("module");
        dl.appendChild(dt);
        dl.appendChild(dd);
        result.appendChild(dl);
        let attList = elt.querySelector("tei-attlist");
        if (attList) {
          result.appendChild(attList.cloneNode(true));
        }
        let exempla = elt.querySelectorAll("tei-exemplum");
        for (let i =0; i < exempla.length; i++) {
          result.appendChild(exempla[i].cloneNode(true));
        }
        let remarks = elt.querySelector("tei-exemplum>tei-remarks");
        if (remarks) {
          result.appendChild(remarks.cloneNode(true));
        }
        result.appendChild(elt.querySelector("tei-content").cloneNode(true));
        return result;
      },
      "exemplum": ["<dl><dt>Example</dt><dd>", "</dd></dl>"],
      "gloss": [
        ["cetei-translate>tei-gloss", function(elt){
          let result = document.createElement("form");
          result.innerHTML = "<textarea class=\"translate\">" + normalize(this.serialize(elt, true)) + "</textarea>";
          return result;
        }],
        ["*[lang=en]", ["<summary class=\"translatable\">", "</summary> "]]
      ],
      "remarks": [
        ["cetei-translate>tei-remarks", function(elt){
          let result = document.createElement("form");
          result.innerHTML = "<textarea class=\"code translate\">" + normalize(this.serialize(elt, true)) + "</textarea>";
          return result;
        } ],
        ["*[lang=en]", function(elt) {
          let result = document.createElement("dl");
          result.innerHTML = "<dt><span class=\"i18n\">Notes</span></dt><dd class=\"translatable\">" + elt.innerHTML + "</dd>";
          return result;
        }]
      ]
    }
  }
}

export default Translator