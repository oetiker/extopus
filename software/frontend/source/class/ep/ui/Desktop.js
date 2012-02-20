/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
#asset(qx/icon/${qx.icontheme}/16/actions/list-add.png)
*/
/**
 * Build the desktop. This is a singleton. So that the desktop
 * object and with it the treeView and the searchView are universaly accessible
 */
qx.Class.define("ep.ui.Desktop", {
    extend : qx.ui.core.Widget,
    type : 'singleton',

    construct : function() {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.VBox(5));
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
        _tabView: null,
       /**
        * add an extra Tab to the TabView
        */
        add: function(page){
            // we can not use the regular add, since I added an extra
            // item to the tabView slide bar ... tabs would get missaligned
            this._tabView.addAt(page,this._tabView.getChildren().length-1);
        },
       /**
        * addAt an extra Tab to the TabView at a particular position
        */
        addAt: function(page,index){
            this._tabView.addAt(page,index);
        },
       /**
        * set the selction in the tabView
        */
        setSelection: function(sel){
            this._tabView.setSelection(sel);
        },
        
       /**
        * To populate the desktop object, we need access to the configuration.
        * with this method (to be called only once) we provide the necessary
        * information and setup the content of the desktop
        *
        * @param cfg {Map} a map representing the content of the FRONTEND section in the extops.cfg file
        * @return {void}  
        */
        populate : function(cfg) {

            /* tab view */

            var tabView = this._tabView = new qx.ui.tabview.TabView();
            this._add(tabView, { flex : 1 });

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

            /* add New tab Button */
         
            this._addPlusMenu();
   
            /* add title */

            if (cfg.frontend.title) {
                document.title = cfg.frontend.title;
                var title = new qx.ui.basic.Label(cfg.frontend.title).set({ font : 'bold' });
                this.getApplicationRoot().add(title, {
                    top   : 8,
                    right : 8
                });
                // reserve space for the title
                title.addListenerOnce('appear',function(){
                    var el = title.getContainerElement().getDomElement();
                    var width = qx.bom.element.Dimension.getWidth(el);
                    tabView.getChildControl('bar').setMarginRight(width + 20);
                },this);
            }

            /* about line */

            this._addAbout();
            /* activate history manager */
            ep.data.RemoteControl.getInstance();
        },


        /**
         * Add the about line to the desktop
         *
         * @return {void} 
         */
        _addAbout : function() {
            var about = new qx.ui.basic.Label(this.tr('Extopus - the Opensource Monitoring Aggregator // #VERSION# // &copy; #YEAR# by OETIKER+PARTNER AG')).set({
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

            this._add(about);
        },
        /**
         * add the plus menu into the tabview bar
         */
        _addPlusMenu: function(){    
            var plus = new qx.ui.basic.Atom(null,"icon/16/actions/list-add.png").set({
                margin: [4,4,4,4],
                appearance: "menubar-button",
                center: true,
                show: 'icon'
            });
            var menu = new qx.ui.menu.Menu().set({
                opener: plus
            });
            menu.add(new qx.ui.menu.Button("Add Tab from Server"));
            plus.addListener('click',function(){
                qx.ui.menu.Manager.getInstance().hideAll();
                menu.open();
                plus.addState("pressed");
            });
            plus.addListener('mouseover', function(){
                plus.addState("hovered");
            });
            plus.addListener('mouseout', function(){
                plus.removeState("hovered");
            });
            menu.addListener('appear',function(){
                plus.addState("pressed");                
            });
            menu.addListener('disappear',function(){
                plus.removeState("pressed");                
            });
            
            this._tabView.getChildControl('bar').add(plus);
        }
    }
});
