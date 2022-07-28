import CETEI from 'CETEIcean';

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
      if (e.tagName == 'TEI-ITEM') {
        result += "[tei:label='" + e.firstElementChild.innerText + "']";
      }
      if (e.hasAttribute('ident')) {
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
          let ws = enElt.previousSibling.nodeValue.replace(/.*(\s+)$/, "$1");
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
        result.innerHTML = "<dt><span class=\"i18n\" data-key=\"contentmodel\">Content model</span></dt><dd><pre>" + this.serialize(elt.querySelector("*"), false, "").replace(/</g, "&lt;") + "</pre></dd>";
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
        dt.innerHTML = "<span class=\"i18n\" data-key=\"module\">Module</span>";
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
      "exemplum": ["<dl><dt class=\"i18n\" data-key=\"example\">Example</dt><dd>", "</dd></dl>"],
      "gloss": [
        ["cetei-translate>tei-gloss", function(elt){
          let result = document.createElement("form");
          result.innerHTML = "<textarea class=\"translate\">" + this.serialize(elt, true).replace(/^( |\t)+/gm, "") + "</textarea>";
          return result;
        }],
        ["tei-item>tei-gloss[lang=en]", ["<span class=\"translatable\">", "</span>"]],
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
          result.innerHTML = "<dt><span class=\"i18n\" data-key=\"notes\">Notes</span></dt><dd class=\"translatable\">" + elt.innerHTML + "</dd>";
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