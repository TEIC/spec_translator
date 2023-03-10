# Spec Translator
Code to manage translations of TEI Guidelines Specifications.

## Internationalization
The interface translations for the application are located in the [TEI repo](https://github.com/TEIC/TEI/blob/dev/I18N/spec_translator.xml). 
Translations may be added via pull request. The translations are in the form of a TEI document with a list of glosses and descriptions, for example:
```xml
 <item>
   <label>browse</label>
   <gloss xml:lang="en" versionDate="2022-06-01">Browse</gloss>
   <gloss xml:lang="es" versionDate="2022-06-07">Navegar</gloss>
   <desc xml:lang="en" versionDate="2022-06-01">Find a documentation page to translate.</desc>
   <desc xml:lang="es" versionDate="2022-06-14">Encuentra una página de documentación para traducir.</desc>
 </item>
```
To add a new translation, simply add `<gloss>` or `<desc>` elements with the appropriate language code in `@xml:lang` and today's date 
in the `@versionDate`.
