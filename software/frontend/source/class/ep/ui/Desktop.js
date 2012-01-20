/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Build the desktop. This is a singleton. So that the desktop
 * object and with it the treeView and the searchView are universaly accessible
 */
qx.Class.define("ep.ui.Desktop", {
    extend : qx.ui.container.Composite,
    type : 'singleton',

    construct : function() {
        this.base(arguments);
        this.setLayout(new qx.ui.layout.VBox(5));
    },

    properties : {
       /**
        * pointer to the treeView object.
        */
        treeView   : {},
       /** 
        * pointer to the searchView object
        */
        searchView : {}
    },

    members : {
       /**
        * To populate the desktop object, we need access to the configuration.
        * with this method (to be called only once) we provide the necessary
        * information and setup the content of the desktop
        *
        * @param cfg {Map} a map representing the content of the FRONTEND section in the extops.cfg file
        * @return {void}  
        */
        populate : function(cfg) {

            /* large logo */

            this._addLogo(cfg.frontend.logo_top);

            /* tab view */

            var tabView = new qx.ui.tabview.TabView();
            this.add(tabView, { flex : 1 });

            /* add tree */

            var treeView = new ep.ui.TreeView(cfg.treeCols, cfg.frontend.open_branches);
            this.setTreeView(treeView);
            var treePage = new qx.ui.tabview.Page(this.tr("Tree"));
            treePage.setLayout(new qx.ui.layout.Grow());
            treePage.add(treeView);
            tabView.add(treePage);

            /* add search */

            var searchView = new ep.ui.SearchView(cfg.searchCols);
            this.setSearchView(searchView);
            var searchPage = new qx.ui.tabview.Page(this.tr("Search"));
            searchPage.setLayout(new qx.ui.layout.Grow());
            searchPage.add(searchView);
            tabView.add(searchPage);

            /* add title */

            if (cfg.frontend.title) {
                document.title = cfg.frontend.title;

                this.getApplicationRoot().add(new qx.ui.basic.Label(cfg.frontend.title).set({ font : 'bold' }), {
                    top   : 8,
                    right : 8
                });
            }

            /* about line */

            this._addAbout();
            /* activate history manager */
            ep.data.History.getInstance();
        },


        /**
         * Add the Logo to the desktop
         *
         * @param url {String} url of the logo
         * @return {void} 
         */
        _addLogo : function(url) {
            if (!url) {
                return;
            }

            var logo = new qx.ui.basic.Atom(null, url).set({
                alignX      : 'left',
                padding     : 8,
                show        : 'icon',
                toolTipText : 'click to hide'
            });

            logo.addListener('click', function() {
                this.remove(logo);
            }, this);

            this.add(logo);
        },


        /**
         * Add the about line to the desktop
         *
         * @return {void} 
         */
        _addAbout : function() {
            var about = new qx.ui.basic.Label(this.tr('Extopus - the Opensource Monitoring Agreggator // #VERSION# // &copy; #YEAR# by OETIKER+PARTNER AG')).set({
                cursor        : 'pointer',
                alignX        : 'right',
                paddingRight  : 5,
                paddingBottom : 3,
                rich          : true,
                font          : 'small',
                toolTipText   : 'www.extopus.org'
            });

            about.addListener('click', function() {
                qx.bom.Window.open('http://extopus.org/', '_blank');
            });

            this.add(about);
        }
    }
});
