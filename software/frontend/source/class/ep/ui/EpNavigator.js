/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Navigation Window with tree and table
 */
qx.Class.define("ep.ui.EpNavigator", {
    extend : qx.ui.core.Widget,

    construct : function(service) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        this._createChildControl('eptree');
        this._createChildControl('epsearch');
    },

    properties: {
       /** Appearance of the widget */
       appearance : {
          refine : true,
          init   : "epnavigator"
       }
    },

    members : {
        /**
         * get the kids ready
         *
         * @param id {var} TODOC
         * @return {var} TODOC
         */
        _createChildControlImpl : function(id) {
            var control;
            switch(id)
            {
                case "eptabview":
                    control = new qx.ui.tabview.TabView();                    
                    this._add(control);
                    break;
                case "eptree": 
                    var page = new qx.ui.tabview.Page(this.tr("Nodes"));
                    var tabview = this.getChildControl('eptabview');
                    tabview.add(page);
                    page.setLayout(new qx.ui.layout.Grow());                    
                    control = new ep.ui.EpTree();
                    page.add(control);
                    break;
                case "epsearch":
                    var page = new qx.ui.tabview.Page(this.tr("Search"));
                    var tabview = this.getChildControl('eptabview');
                    tabview.add(page);
                    page.setLayout(new qx.ui.layout.Grow());                    
                    control = new ep.ui.EpTable();
                    page.add(control);
                    break;
            }
            return control || this.base(arguments, id);
        }
    }
});
