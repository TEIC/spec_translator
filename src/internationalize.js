import { getBlobContent } from './api.js';
class Internationalize {
  
  constructor(ceteicean) {
    this.languages = ['de','en','es','it','ja','ko','zh'];
    this.replacements = ['tei:ref'];
    this.ct = ceteicean;
  }

  static async init(owner, repo, branch, ceteicean) {
    let content;
    if (owner) {
      content = await getBlobContent(owner, repo, branch, 'I18N/spec_translator.xml');
    } else {
      content = await (await fetch('https://raw.githubusercontent.com/TEIC/TEI/dev/I18N/spec_translator.xml')).text();
    }
    const result = new Internationalize(ceteicean);
    result.dom = ( new DOMParser() ).parseFromString(content, "text/xml");
    result.glossary = {};
    if (result.ct) {
      result.ct.define(result.replacements);
    }
    let items = result.dom.querySelectorAll('item');
    items.forEach(item => {
      let label = item.querySelector('label').innerHTML;
      let glosses = item.querySelectorAll('gloss');
      let descs = item.querySelectorAll('desc');
      let notes = item.querySelectorAll('note');
      result.glossary[label] = {};
      for (let gloss of glosses) {
        result.glossary[label][gloss.getAttribute('xml:lang')] = {'gloss': result.fixTEI(gloss.innerHTML)};
      }
      for (let desc of descs) {
        if (result.glossary[label][desc.getAttribute('xml:lang')]) {
          result.glossary[label][desc.getAttribute('xml:lang')]['desc'] = result.fixTEI(desc.innerHTML);
        } else {
          result.glossary[label][desc.getAttribute('xml:lang')]['desc'] = {'desc': result.fixTEI(desc.innerHTML)};
        }
      }
      for (let note of notes) {
        result.glossary[label][note.getAttribute('xml:lang')]['note'] = result.fixTEI(note.innerHTML);
      }
    });
    return result;
  }

  fixTEI(str) {
    let result = str.replace(/xmlns:?\w*="[^"]+"/g, '');
    this.replacements.forEach(replacement => {
      let r = replacement.replace(/tei:/,'');
      result = result.replace(`<${r}`, `<tei-${r.toLowerCase()}`);
      result = result.replace(`</${r}`, `</tei-${r.toLowerCase()}`);
      result = result.replace(/<((?!\/)[^>]+)>/, '<$1 data-origname="' + r + '">');
    });
    return result;
  }

  gloss(term, lang, ...params) {
    if (!lang) {
      lang = this.language;
    }
    let result;
    if (this.conv(term, lang)?.gloss) {
      result = this.conv(term, lang).gloss;
    } else {
      result = this.conv(term, 'en')?.gloss ? this.conv(term, 'en').gloss : '';
    }
    if (params) {
      for (let i = 0; i < params.length; i++) {
        result = result.replace('$' + (i + 1), params[i]);
      }
    }
    return result;
  }

  desc(term, lang) {
    if (!lang) {
      lang = this.language;
    }
    if (this.conv(term, lang)?.desc) {
      return this.conv(term, lang).desc;
    } else {
      return this.conv(term, 'en').desc ? this.conv(term, 'en').desc : '';
    }
  }

  note(term, lang) {
    if (!lang) {
      lang = this.language;
    }
    if (this.conv(term, lang)?.note) {
      return this.conv(term, lang).note;
    } else {
      return this.conv(term, 'en').note ? this.conv(term, 'en').note : '';
    }
  }

  conv(term, lang) {
    return this.glossary[term] ? this.glossary[term][lang] : null; 
  }

  setup() {
    let language = window.localStorage.getItem('language');
    if (!language) {
      language = window.navigator.language ? window.navigator.language : 'en';
    }
    if (this.supportsLang(language)) {
      this.setLang(language.substring(0,2));
    } else {
      this.setLang('en');
    }
    document.querySelector('body').style.display = 'block';
  }

  setLang(lang) {
    document.querySelectorAll('.i18n').forEach(elt => {
      let c = this.conv(
        elt.hasAttribute('data-key') ? elt.getAttribute('data-key') : elt.innerText.toLowerCase().replace(/ /g, ''), 
        lang);
      if (c?.gloss) {
        elt.innerHTML = c.gloss;
      }
      if (c?.desc) {
        elt.setAttribute('title', c.desc);
      }
      if (elt.hasAttribute('href') && elt.getAttribute('href').match(/^\w+_\w\w\.html$/)) {
        let href = elt.getAttribute('href');
        elt.setAttribute('href', href.replace(/_\w\w/, `_${lang}`));  
      }
    });
    this.language = lang;
    window.localStorage.setItem('language', lang);
  }

  supportsLang(lang) {
    return this.languages.includes(lang.substring(0,2));
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
}

export default Internationalize;