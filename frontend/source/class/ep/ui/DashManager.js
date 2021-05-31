/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * The Dashboard Manager manages our Dashboards
 */

qx.Class.define("ep.ui.DashManager", {
    extend: qx.core.Object,
    type: 'singleton',

    construct : function() {
        this.base(arguments);
        this._boardMap = {};
    },
    events: {
        addBoard: 'qx.event.type.Data'
    },
    properties: {
        boardList: {
            init: []
        }
    },
    members: {
        _boardMap: null,
        /**
         * Add a new Board
         * 
         * @param name {String} name of the new board. If it is empty, ask.
         */
        newBoard: function(name){
            var dt = ep.ui.Desktop.getInstance();
            var board = new ep.ui.DashBoard(name);
            dt.add(board);
            dt.setSelection([board]);
            board.addListener('changeDashId',function(e){
                var id = e.getData();
                var oldId = e.getOldData();
                if (oldId){
                    delete this._boardMap[oldId];
                }
                this._boardMap[id] = true;
            },this);
            board.addListener('close',function(e){
                var id = board.getDashId();
                delete this._boardMap[id];
                this.setBoardList(this.getBoardList().filter(function(item){item !== board},this));
            },this);
            this.fireDataEvent('addBoard',board);
            return board;
        },
        /**
         * check if  the given board is already open or not
         */
        isBoardOpen: function(id){
            return (this._boardMap[id] == true);
        }
    }
});
