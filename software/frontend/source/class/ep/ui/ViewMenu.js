/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
#asset(ep/view-*.png)
*/

/**
 * The ViewPage Menu
 */

qx.Class.define("ep.ui.ViewMenu", {
    extend: qx.ui.menu.Menu,
    type: 'singleton',

    construct : function() {
        this.base(arguments);
        var dm = ep.ui.DashManager.getInstance();
        dm.getBoardList().forEach(this.registerBoard,this);

        var breakOutBtn = new qx.ui.menu.Button(this.tr("Breakout Window"));
        breakOutBtn.addListener('execute',function(e){
            this._tab.fireDataEvent("breakout", this._tab);
        },this);
        this.add(breakOutBtn);

        var link = new qx.ui.menu.Button(this.tr("Show Direkt Link"));
        link.addListener('execute',function(e){
            ep.data.RemoteControl.getInstance().setState(this._tab.getVisualizer().buildLink());
        },this);
        this.add(link);
        
        var nd;
        var dashMenu = this._dashMenu = new qx.ui.menu.Menu();
        this.add(new qx.ui.menu.Button(this.tr("Add to Dashboard"),null,null,dashMenu));

        dashMenu.add(nd = new qx.ui.menu.Button("New ..."));
        nd.addListener('execute',function(){
            var board = ep.ui.DashManager.getInstance().newBoard(null);
            board.addVisualizer(this._tab.getVisualizer().getVizualizerConfig());
            ep.ui.Desktop.getInstance().setSelection([board]);
        },this);
    },
    members: {
        _tab: null,
        _dashMenu: null,
        /**
         * add a new board to the menu
         * 
         * @param board {qx.ui.tabview.Page} dashboard
         */
        registerBoard: function(board){
            var button = new qx.ui.menu.Button(board.getLabel());
            board.getChildControl('button').addListener('changeLabel',function(e){
                button.setLabel(e.getData());
            });
            button.addListener('execute',function(){
                ep.ui.Desktop.getInstance().setSelection([board]);
                board.addVisualizer(this._tab.getVisualizer().getVizualizerConfig());
            },this);
            board.addListenerOnce('close',function(){
                this._dashMenu.remove(button);
            },this);
            this._dashMenu.add(button);            
        },
        /**
         * Show the dashBoard menu at the given widget position
         * 
         * @param widget {Widget} widget for positioning the menu
         */
        showMenu: function(widget,tab){
            this._tab = tab;
            this.setOpener(widget);
            qx.ui.menu.Manager.getInstance().hideAll();
            this.open();
        }
    }
});
