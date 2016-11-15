'use babel';

import { Disposable } from 'atom';
import shell from 'shell';
import cljs from 'clojurescript';
import vars from './vars';

const exts = ['.clj', '.cljs', '.cljc'];
const fileTypes = ['clj', 'cljs', 'cljc'];

function shouldEnable(editor) {
  if (editor) {
    const filename = editor.getPath;
    const ftypes = editor.getGrammar().fileTypes;
    return (typeof filename === 'string' &&
            exts.some((ext) => filename.endsWith(ext))) ||
           fileTypes.some((ft) => ftypes.some((ftt) => ftt === ft));
  } else {
    return false;
  }
}

class CljsDocView extends HTMLElement {

  initialize() {

    this.viewUpdatePending = false;

    this.classList.add('cljs-doc', 'inline-block');

    this.style.display = 'none';

    this.docEl = document.createElement('a');
    this.docEl.classList.add('inline-block');
    this.docEl.href = '#';

    this.appendChild(this.docEl);

    this.activeItemSubscription = atom.workspace.onDidChangeActivePaneItem(() => {
      this.subscribeToActiveTextEditor();
    });

    this.subscribeToActiveTextEditor();

    const clickHandler = () => this.showDoc();

    this.addEventListener('click', clickHandler);
    this.clickSubscription = new Disposable(() => this.removeEventListener('click', clickHandler));
  }

  destroy() {

    this.activeItemSubscription.dispose();
    this.clickSubscription.dispose();

    if (this.cursorSubscription) {
      this.cursorSubscription.dispose();
    }
  }

  subscribeToActiveTextEditor() {

    const activeEditor = this.getActiveTextEditor();

    if (shouldEnable(activeEditor) === false) {
      this.toggleDocPanel(false);
      return;
    }

    if (this.cursorSubscription) {
      this.cursorSubscription.dispose();
    }

    if (activeEditor) {

      this.cursorSubscription = activeEditor.onDidChangeCursorPosition(({ cursor }) => {

        if (this.viewUpdatePending === false && cursor === activeEditor.getLastCursor()) {

          this.viewUpdatePending = true;

          let word = activeEditor.getWordUnderCursor();

          if (typeof word === 'string') {
            word = word.trim();
          }

          const isValid = vars.includes(word);

          if (isValid) {
            this.lastWord = word;
            this.toggleDocPanel(true, word);
          } else {
            this.toggleDocPanel(false);
          }

          this.viewUpdatePending = false;
        }
      });
    }
  }

  getActiveTextEditor() {
    return atom.workspace.getActiveTextEditor();
  }

  toggleDocPanel(show, symbol) {
    if (show) {
      this.style.display = 'inline-block';
      this.docEl.textContent = `(doc ${symbol})`;
    } else {
      this.style.display = 'none';
      this.docEl.textContent = '';
    }
  }

  showDoc() {
    try {
      const doc = cljs.eval(`(doc ${this.lastWord})`);
      const scoll = doc.split('\n');

      scoll.pop();
      scoll.shift();

      const link = `https://clojuredocs.org/clojure.core/${this.lastWord}`;

      atom.notifications.addInfo(`(doc ${this.lastWord})`, {
        detail: scoll.join('\n'),
        dismissable: true,
        buttons: [
          {
            text: 'Read on ClojureDocs',
            onDidClick: () => shell.openExternal(link),
          }
        ],
      });
    } catch (err) {

    }
  }

}

export default document.registerElement('cljs-doc', {
  prototype: CljsDocView.prototype,
  extends: 'div',
});
