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
 * The Dashboard Menu
 */

qx.Class.define("ep.ui.DashMenu", {
    extend: qx.ui.menu.Menu,
    type: 'singleton',

    construct : function() {
        this.base(arguments);
        var btn = [
            [ 'ren',this.tr("Rename Board"),   null, function(e){ this._board.editLabel(); }],
            [ 'edt',this.tr("Edit Board"),   null, function(e){ this._board.fireEvent.call(this._board,'startEditMode'); }],
            [ 'rm',this.tr("Hide Board"),    null, function(e){ this._board.fireEvent.call(this._board,'close'); }],
            [ 'srm',this.tr("Delete Board"),  null, this._deleteBoard]
        ];
        var menuBtn = {};
        btn.forEach(function(item){
            var bt = menuBtn[item[0]] = new qx.ui.menu.Button(item[1],item[2]);
            if (item[3]){
                bt.addListener('execute',item[3],this);
            }
            this.add(bt);
        },this);
    },
    members: {
        _board: null,
        _deleteBoard: function(e){
            var rpc = ep.data.Server.getInstance();
            var board = this._board;
            rpc.callAsyncSmart(function(ret){
                if (!ret){
                    ep.ui.MsgBox.getInstance().warn("Failed to Remove Dashboard","The Dashboard may have been modified in the mean time.");
                }
                board.fireEvent.call(board,'close');
            },'deleteDash',board.getDashId(),board.getUpdateTime());
        },
        /**
         * Show the dashBoard menu at the given widget position
         * 
         * @param widget {Widget} widget for positioning the menu
         */        
        showMenu: function(button,board){
            this._board = board;
            this.setOpener(button);
            qx.ui.menu.Manager.getInstance().hideAll();
            this.open();
        }
    }
});
