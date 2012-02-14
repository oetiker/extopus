/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * The Dashboard Menu
 */

qx.Class.define("ep.ui.DashMenu", {
    extend: qx.ui.menu.Menu,
    type: 'singleton',

    construct : function() {
        this.base(arguments);
        var dm = ep.ui.DashManager.getInstance();
        dm.getBoardList().forEach(this.registerBoard,this);
        var nd;
        this.addSeparator();
        this.add(nd = new qx.ui.menu.Button("Create New Dashboard ..."));
        nd.addListener('execute',function(){
            var board = ep.ui.DashManager.getInstance().newBoard(null,[0,0,1,1]);
            board.addVisualizer(this._cfg);
        },this);
    },
    members: {
        _cfg: null,
        registerBoard: function(board){
            var button = new qx.ui.menu.Button(board.getLabel());
            board.getChildControl('button').addListener('changeLabel',function(e){
                button.setLabel(e.getData());
            });
            button.addListener('execute',function(){
                ep.ui.Desktop.getInstance().setSelection([board]);
                board.addVisualizer(this._cfg);
            },this);
            this.addAt(button,0);            
        },
        /**
         * Show the dashBoard menu at the given widget position
         * 
         * @param widget {Widget} widget for positioning the menu
         */
        showMenu: function(widget,cfg){
            this._cfg = cfg;
            this.setOpener(widget);
            qx.ui.menu.Manager.getInstance().hideAll();
            this.open();
        }
    }
});
