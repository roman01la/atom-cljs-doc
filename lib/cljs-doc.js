'use babel';

import CljsDocView from './cljs-doc-view';

export default {

  activate(state) {

    this.docView = new CljsDocView();

    this.docView.initialize();
  },

  deactivate() {

    if (this.docView) {
      this.docView.destroy();
    }
    this.docView = null;

    this.statusBar = null;
  },

  consumeStatusBar(statusBar) {

    this.statusBar = statusBar;

    this.statusBar.addRightTile({
      item: this.docView,
      priority: 10,
    });
  }

};
