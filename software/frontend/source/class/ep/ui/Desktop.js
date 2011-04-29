/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Navigation Window with tree and table
 */
qx.Class.define("ep.ui.Desktop", {
    extend : qx.ui.container.Composite,
    type: 'singleton',

    construct : function() {
        this.base(arguments);
        this.setLayout(new qx.ui.layout.Grow());

        var tabView = new qx.ui.tabview.TabView();
        this.add(tabView);

        /* add tree */       
        var treeView = new ep.ui.TreeView();
        this.setTreeView(treeView);
        var treePage = new qx.ui.tabview.Page(this.tr("Tree"));
        treePage.setLayout(new qx.ui.layout.Grow());
        treePage.add(treeView);
        tabView.add(treePage);

        /* add search */       
        var searchView = new ep.ui.SearchView();    
        this.setSearchView(searchView);
        var searchPage = new qx.ui.tabview.Page(this.tr("Search"));
        searchPage.setLayout(new qx.ui.layout.Grow());
        searchPage.add(searchView);
        tabView.add(searchPage);
    },
    properties: {
        treeView: {},
        searchView: {}
    }
});
