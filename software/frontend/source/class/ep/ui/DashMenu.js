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
            [ 'ren',this.tr("Rename"),   null, function(e){ this._board.editLabel(); }],
            [ 'edt',this.tr("Edit"),   null, function(e){ this._board.fireEvent.call(this._board,'startEditMode'); }],
            [ 'close',this.tr("Close"),    null, function(e){ this._board.fireEvent.call(this._board,'close'); }],
            [ 'srm',this.tr("Delete"),  null, this._deleteBoard]
        ];
        btn.forEach(function(item){
            var bt = new qx.ui.menu.Button(item[1],item[2]);
            if (item[3]){
                bt.addListener('execute',item[3],this);
            }
            this.add(bt);
        },this);
    },
    members: {
        _board: null,
        _deleteBoard: function(e){
            var board = this._board;
            ep.ui.MsgBox.getInstance().warn(this.tr("Delete Dashboard"),this.tr("Permanantly delete this dashboard from the server."),
                function(){
                    var rpc = ep.data.Server.getInstance();
                    rpc.callAsyncSmart(function(ret){
                        if (!ret){
                            ep.ui.MsgBox.getInstance().warn("Failed" ,"Could not remove dashboard. The dashboard may have been modified in the mean time.");
                        }
                        board.fireEvent.call(board,'close');
                    },'deleteDash',board.getDashId(),board.getUpdateTime());
                }
            );
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
