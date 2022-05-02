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
  logOut() {
    window.sessionStorage.clear();
  }
  async getCurrentUser() {
    const response = await fetch('https://api.github.com/user',
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      }});
    return response.json();
  }
  async userExists(login) {
    const response = await fetch(`https://api.github.com/users/${login}`,
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
      }});
    return response.json();
  }
  async orgExists(login) {
    const response = await fetch(`https://api.github.com/orgs/${login}`,
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
      }});
    return response.json();
  }
  async checkOwner(owner) {
    const isOrg = await this.orgExists(owner);
    if (isOrg.login) {
      const member = await this.checkMembership(window.sessionStorage.getItem('user'), owner);
      if (member) {
        return 'organization';
      } else {
        return false;
      }
    }
    const isUser = await this.userExists(owner);
    if (isUser.login) {
      return 'user';
    }
    return false;
  }
  async checkMembership(user, org) {
    const response = await fetch(`https://api.github.com/orgs/${org}/members/${user}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      }
    });
    return response.status == 204;
  }
  async getRepos(owner, page) {
    const response = await fetch('https://api.github.com/graphql', { 
      method: 'POST',
      headers: {
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      },
      body: `{	"query": "query {repositoryOwner(login:\\"${owner}\\") {repositories(first: 100, isFork: true${page}) {pageInfo {startCursor, hasNextPage, endCursor}, totalCount,nodes {name parent {nameWithOwner}}}}}"}`
    });
    return response.json();
  }
  async getBranch(owner, repo, branch) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token'),
      }});
    return response.json();
  }
  async createRef(ref, sha) {
    const owner = window.sessionStorage.getItem('owner');
    const repo = window.sessionStorage.getItem('repo');
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token'),
      },
      body: `{"ref":"refs/heads/${ref}", "sha":"${sha}"}`
    });
    return response.json();
  }
  async updateRef(ref, sha) {
    const owner = window.sessionStorage.getItem('owner');
    const repo = window.sessionStorage.getItem('repo');
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${ref}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token'),
      },
      body: `{"sha":"${sha}"}`
    });
    return response.json();
  }
  async getCollaborators(owner, repo) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators`,
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token'),
      }});
      return response.json();
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
    return response.json();
  }
  async deleteUnprotectedBranches(owner, repo) {
    const branches = await this.getBranches(owner, repo);
    for (const branch of branches ) {
      if (!['dev','released'].includes(branch.name)) {
        this.deleteRef(owner, repo, branch.name);
      }
    }
  }
  async deleteRef(owner, repo, ref) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${ref}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      }
    });
    return response.ok;
  }
  async mergeUpstream(owner, repo, branch='dev') {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/merge-upstream`,
      { method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': 'token ' + window.sessionStorage.getItem('token')
        },
        body: `{"branch":"${branch}"}`
      });
    return response.status;
  }
  async getBranches(owner, repo) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`,
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      }});
    return response.json();
  }
  // Get branches that do not match branch names in TEIC/TEI
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
  async getTEIRepo(owner, acc = [], page = '') {
    const json = await this.getRepos(owner, page);
    acc.push(...json.data.repositoryOwner.repositories.nodes.filter(repo => repo.parent.nameWithOwner == 'TEIC/TEI'));
    if (json.data.repositoryOwner.repositories.pageInfo.hasNextPage) {
      return this.geTEIRepo(owner, acc, `,after:"${json.data.repositoryOwner.repositories.pageInfo.endCursor}")`);
    } else {
      return acc[0];
    }
  }
  async verifyTEIRepo(owner, name) {
    const data = `{\n query { \n repository(owner:"${owner}", name"${name}") \n parent {\n nameWithOwner\n }\n }\n }`;
    const response = await fetch('https://api.github.com/graphql', { 
      method: 'POST',
      headers: {
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
    }});
    return response.json();
  }
  async getPRForBranch(owner, branch) {
    const response = await fetch(`https://api.github.com/repos/TEIC/TEI/pulls?head=${owner}:${branch}`,
      { headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      }});
    return response.json();
  }

  // COMMITS
  async createBlob(blob) {
    const owner = window.sessionStorage.getItem('owner');
    const repo = window.sessionStorage.getItem('repo');
    try {
      const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': 'token ' + window.sessionStorage.getItem('token')
        },
        body: `{"content":${JSON.stringify(blob)}, "encoding":"utf-8"}`
      }));
      return response.json();
    } catch (e) {
      console.log(e);
      return {message: "Exception thrown"};
    }
  }
  async getCommit(owner, repo, sha) {
    const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${sha}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      }
    }));
    return response.json();
  }
  async getTree(owner, repo, sha) {
    const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=true`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      }
    }));
    return response.json();
  }
  async getBlobSHA(owner, repo, branchname, path) {
    // Get HEAD of current branch
    const branch = await this.getBranch(owner, repo, branchname);
    // Get its commit -> head
    const head = branch.commit.sha;
    // get the full tree listing for head.tree
    const trees = await this.getTree(owner, repo, branch.commit.commit.tree.sha);
    return trees.tree.find(tree => tree.path == 'P5/Source/Specs/' + path).sha;
  }
  async getBlobContent(owner, repo, branch, path) {
    const sha = await this.getBlobSHA(owner, repo, branch, path);
    const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      }
    }));
    const json = await response.json();
    return this.b64Decode(json.content);
  }
  b64Decode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }
  async createTree(base, path, sha, blob) {
    const owner = window.sessionStorage.getItem('owner');
    const repo = window.sessionStorage.getItem('repo');
    const mode = blob ? '100644' : '040000';
    const type = blob ? 'blob' : 'tree';
    try {
      const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': 'token ' + window.sessionStorage.getItem('token')
        },
        body: `{"tree":[{"path":"${path}", "mode":"${mode}", "type":"${type}", "sha":"${sha}"}], "base_tree":"${base}"}`
      }));
      return response.json();
    } catch (e) {
      console.log(e);
      return {message: "Exception thrown"};
    }
  }
  async createCommit(message, tree, parent) {
    const owner = window.sessionStorage.getItem('owner');
    const repo = window.sessionStorage.getItem('repo');
    try {
      const response = await(fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': 'token ' + window.sessionStorage.getItem('token')
        },
        body: `{"message":"${message}", "tree":"${tree}", "parents":["${parent}"]}`
      }));
      return response.json();
    } catch (e) {
      console.log(e);
      return {message: "Exception thrown"};
    }
  }
  async commit(path, content, message) {
    const owner = window.sessionStorage.getItem('owner');
    const repo = window.sessionStorage.getItem('repo');
    const branchname = window.sessionStorage.getItem('branch');
    // Get HEAD of current branch
    const branch = await this.getBranch(owner, repo, branchname);
    // Get its commit -> head
    const head = branch.commit.sha;
    // save the content createBlob() -> blob_sha
    const blob = await this.createBlob(content);
    // get the full tree listing for head.tree
    const trees = await this.getTree(owner, repo, branch.commit.commit.tree.sha);
    // get the tree for the new blob's path -> old_blob_tree_sha
    const old_specs_sha = trees.tree.find(tree => tree.path == 'P5/Source/Specs').sha;
    // create a new tree for the blob -> P5_Source_Specs_sha
    const new_specs = await this.createTree(old_specs_sha, path, blob.sha, true);
    // get the tree sha for P5/Source -> old_P5_Source_sha
    const old_source_sha = trees.tree.find(tree => tree.path == 'P5/Source').sha;
    // create a new tree for P5/Source -> P5_Source_sha
    const new_source = await this.createTree(old_source_sha, 'Specs', new_specs.sha, false);
    // get the tree sha for P5 -> old_P5_sha
    const old_p5_sha = trees.tree.find(tree => tree.path == 'P5').sha;
    // create a new tree for P5 -> P5_sha
    const new_p5 = await this.createTree(old_p5_sha, 'Source', new_source.sha, false);
    const new_tree = await this.createTree(branch.commit.commit.tree.sha, 'P5', new_p5.sha, false);
    // create new commit (parents:[head], message, tree:P5_sha) -> new_head
    const new_head = await this.createCommit(message, new_tree.sha, head);
    // update branch ref to new_head
    return await this.updateRef(branchname, new_head.sha);
  }
  async createPullRequest(message) {
    const owner = window.sessionStorage.getItem('owner');
    const branch = window.sessionStorage.getItem('branch');
    const response = await(fetch(`https://api.github.com/repos/TEIC/TEI/pulls`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + window.sessionStorage.getItem('token')
      },
      body: `{"head":"${owner}:${branch}", "base":"dev", "title":"${message}"}`
    }));
    return response.json();
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
    let parent = elt && elt.parentElement ? this.teiParent(elt.parentElement) : null;
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
      if (e.tagName == 'TEI-VALITEM') {
        result += "[@ident='" + e.getAttribute('ident') + "']";
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
    let atts = elt.getAttribute('data-origatts').split(' ');
    Array.from(elt.attributes).forEach(att => {
      if (!att.name.startsWith("data-") && att.name != 'lang') {
        e.setAttribute(atts.find(a => a.toLowerCase() == att.name), att.value);
      }
    });
    e.innerHTML = elt.querySelector("textarea").value;
    return e;
  }
  updateSource(doc, elt) {
    let xpath = this.getTEIXPath(elt);
    let result = doc.evaluate(xpath, doc, this.resolveNS, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    let enElt = doc.evaluate(xpath.replace(/xml:lang=("|')[^"']+("|')/, 'xml:lang="en"'), doc, 
                   this.resolveNS, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (result.singleNodeValue) {
      // Remove element if translation has been deleted
      if (elt.value == '') {
        result.singleNodeValue.parentElement().removeChild(result.singleNodeValue);
      } else {
        // No-op if text hasn't changed
        if (this.normalize(result.singleNodeValue.innerHTML) != this.normalize(elt.value)) {
          result.singleNodeValue.innerHTML = elt.value;
          result.singleNodeValue.setAttribute('versionDate', (new Date()).toISOString().substring(0,10));
        }
      }
    } else { // New translation; skip if empty
      if (elt.value == '') {
        return doc;
      }
      // No-op if text is the same as the en element
      if (this.normalize(enElt.innerHTML) != this.normalize(elt.value)) {
        // match indent level of the translated element, if any
        if (enElt?.previousSibling.nodeType === Node.TEXT_NODE) {
          let ws = enElt.previousSibling.nodeValue.replace(/.*(\w+)$/, "$1");
          enElt.insertAdjacentElement('afterend', this.toTEI(doc, this.teiParent(elt)))
            .insertAdjacentText('beforebegin', ws);
        } else {
          enElt.insertAdjacentElement('afterend', this.toTEI(doc, this.teiParent(elt)));
        }    
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
  content() {
    const s = new XMLSerializer();
    return s.serializeToString(this.ct.XML_dom);
  }
  normalize(str) {
    return str.replace(/^( |\t)+/gm, '')
      .replace(/\n/g, '')
      .replace(/\s+$/gm,'')
      .replace(/ xmlns="http:\/\/www.tei-c.org\/ns\/1.0"/g, '');
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
          dd.appendChild(document.createTextNode(elt.getAttribute("minoccurs") + '–' 
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
          result.innerHTML = "<textarea class=\"code translate\">" + this.serialize(elt, true).replace(/^( |\t)+/gm, "") + "</textarea>";
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
        let remarks = elt.querySelectorAll("tei-elementSpec>tei-remarks");
        remarks.forEach(remark => {
          result.appendChild(remark.cloneNode(true));
        });
        let exempla = elt.querySelectorAll("tei-exemplum");
        for (let i =0; i < exempla.length; i++) {
          result.appendChild(exempla[i].cloneNode(true));
        }
        remarks = elt.querySelector("tei-exemplum>tei-remarks");
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
          result.innerHTML = "<textarea class=\"translate\">" + this.serialize(elt, true).replace(/^( |\t)+/gm, "") + "</textarea>";
          return result;
        }],
        ["*[lang=en]", ["<summary class=\"translatable\">", "</summary> "]]
      ],
      "remarks": [
        ["cetei-translate>tei-remarks", function(elt){
          let result = document.createElement("form");
          result.innerHTML = "<textarea class=\"code translate\">" + this.serialize(elt, true).replace(/^( |\t)+/gm, "") + "</textarea>";
          return result;
        } ],
        ["*[lang=en]", function(elt) {
          let result = document.createElement("dl");
          result.innerHTML = "<dt><span class=\"i18n\">Notes</span></dt><dd class=\"translatable\">" + elt.innerHTML + "</dd>";
          return result;
        }]
      ],
      "valList": (elt) => {
        let result = document.createElement('div');
        result.innerHTML = '<h5>Sample values:</h5>';
        let dl = document.createElement('dl');
        elt.querySelectorAll('tei-valitem').forEach(item => {
          dl.innerHTML += '<dt>' + item.getAttribute('ident') + '</dt><dd>' + item.outerHTML + '</dd>';
        })
        result.appendChild(dl);
        return result;
      }
    }
  }
}

export default Translator