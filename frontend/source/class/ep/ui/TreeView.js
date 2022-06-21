/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * The Extopus node navigation tree with table and view areas.
 */
qx.Class.define("ep.ui.TreeView", {
    extend : qx.ui.core.Widget,

    /**
     * create a navigator tree view
     *
     * @param colDef {Map} column definitions
     * @param treeOpen {Integer} how many tree nodes to open initially
     * @return {void} 
     */
    construct : function(colDef, treeOpen) {
        this.__initial_open = treeOpen;
        this.__colProps = colDef.props;
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        var hPane = new qx.ui.splitpane.Pane("horizontal");
        this._add(hPane);
        var vPane = new qx.ui.splitpane.Pane("vertical");
        vPane.add(this._createTable(colDef.names, colDef.ids, colDef.widths, colDef.props), 1);
        var tree = this._createTree();
        hPane.add(tree, parseInt(ep.data.FrontendConfig.getInstance().getConfig().tree_width));
        this._openTree(tree, tree.getModel(), true);
        hPane.add(vPane, 30);
        vPane.add(new ep.ui.View(this.getTable()), 3);
    },

    properties : {
        /**
         * tree widget
         */
        tree  : {},
        /**
         * table widget
         */
        table : {}
    },

    members : {
        __initial_open : null,
        __colProps: null,
        __dataPattern: null,
        /**
         * Open the tree
         *
         * @param tree {Widget} tree widget
         * @param node {Node} tree node model object
         * @param first {Boolean} is this the first time we decend
         * @return {void} 
         */
        _openTree : function(tree, node, first) {
            if (!node.getKids) {
                if (first) {
                    var sel = tree.getSelection();
                    sel.removeAll();
                    sel.push(node);
                }

                return;
            }

            if (!node.getLoaded()) {
                if (this.__initial_open < 0) {
                    return;
                }

                node.addListenerOnce('changeLoaded', function() {
                    this._openTree(tree, node, first);
                }, this);

                this.__initial_open--;
                tree.openNode(node);
                return;
            }

            if (node.getKids) {
                if (!tree.isNodeOpen(node)) {
                    tree.openNode(node);
                }

                var kids = node.getKids();

                for (var k=0; k<kids.length; k++) {
                    this._openTree(tree, kids.getItem(k), first && k == 0);
                }
            }
        },


        /**
         * Create the tree widget with incremental loading
         *
         * @return {Widget} the tree widget
         */
        _createTree : function() {
            var root = qx.data.marshal.Json.createModel({
                name   : 'root',
                kids   : [],
                leaves : null,
                icon   : 'default',
                loaded : false,
                nodeId : 0
            },
            true);

            this._addNodeKids(root);
            var that = this;

            var control = new qx.ui.tree.VirtualTree(root, 'name', 'kids').set({
                openMode : 'tap',
                hideRoot : true,
                iconPath : 'icon',
                // showTopLevelOpenCloseIcons: true,

                iconOptions : {
                    converter : function(value, model) {
                        if (value == "default") {
                            if (! model.getKids) {
                                return "@TablerIcons/package/22";
                            }
                        }
                        else {
                            return "@TablerIcons/refresh/22";
                        }
                    }
                },

                delegate : {
                    bindItem : function(controller, item, index) {
                        controller.bindDefaultProperties(item, index);

                        controller.bindProperty("", "open", {
                            converter : function(value, model, source, target) {
                                var isOpen = target.isOpen();

                                if (isOpen && !value.getLoaded()) {
                                    that._addNodeKids(value);
                                }

                                return isOpen;
                            }
                        },
                        item, index);
                    }
                }
            });

            control.getSelection().addListener("change", this._setLeavesTable, this);
            this.setTree(control);
            return control;
        },


        /**
         * Create the table widget for showing the nodes matching the selected tree leaf.
         *
         * @param names {Array} column names
         * @param ids {Array} column ids
         * @param widths {Array} column widths
         * @return {Widget} table widget
         */
        _createTable : function(names, ids, widths, props) {
            var tm = new qx.ui.table.model.Simple();
            tm.setColumns(names, ids);
            var control = new ep.ui.Table(tm, widths, props);
            control.exclude();
            this.setTable(control);
            return control;
        },


        /**
         * Add new nodes to the tree
         *
         * @param node {Node} node to add the new nodes to
         * @return {void} 
         */
        _addNodeKids : function(node) {
            var rpc = ep.data.Server.getInstance();

            rpc.callAsyncSmart(function(ret) {
                var kids = node.getKids();
                kids.removeAll();

                ret.forEach(function(branch) {
                    var newNode = {
                        nodeId : branch[0],
                        name   : branch[1],
                        icon   : 'default',
                        loaded : false,
                        leaves : null
                    };

                    if (branch[2]) {
                        newNode.kids = [ {
                            name : 'Loading',
                            icon : 'loading'
                        } ];
                    }

                    var kid = qx.data.marshal.Json.createModel(newNode, true);

                    // keep the data array as a normal array and don't have it qooxdooified
                    kid.setLeaves(branch[3]);
                    kids.push(kid);
                },this);

                node.setLoaded(true);
            },
            'getBranch', node.getNodeId());
        },


        /**
         * Load data into the leaf table and switch visibility of columns according
         * config file instructions
         *
         * @param e {Event} selection event
         * @return {void} 
         */
        _setLeavesTable : function(e) {
            var sel = this.getTree().getSelection();
            var colProps = this.__colProps;
            if (sel.length > 0) {
                var table = this.getTable();
                var tm = table.getTableModel();
                var sm = table.getSelectionModel();
                
                var data = sel.getItem(0).getLeaves();                
                var visCount = 0;
                if (data.length > 0){
                    var showCol = {};
                    for (var i = 0;i<data[0].length;i++){          
                        showCol[i] = colProps[i] == 'S' ? 'Y' : 'N';
                    }
                    var whiteRx = /^\s*$/;
                    for (var i = 0;i<data.length;i++){
                        for (var ii = 0;ii<data[i].length;ii++){
                            var item = data[i][ii];
                            if (colProps[ii] == 'A'
                                && item 
                                && ! whiteRx.test(item)){
                                showCol[ii] = 'Y';
                            }
                        }
                    }
                    var tcm = table.getTableColumnModel();
                    var pattern = '';
                    for (var i = 1;i<data[0].length;i++){
                        if (showCol[i] == 'Y'){
                            pattern += 'Y';
                            visCount ++;
                        }
                        else {
                            pattern += 'N';
                        }
                    }
                    if (pattern != this.__dataPattern){
                        for (var i = 1;i<data[0].length;i++){
                            if (showCol[i] == 'Y'){
                                tcm.setColumnVisible(i, true);
                            }
                            else {
                                tcm.setColumnVisible(i, false);
                            }
                        }   
                        this.__dataPattern = pattern;
                    }
                }
                table.resetSelection();                
                /* if there is only one match and no visible properties
                   hide the leavetable completely */
                if (data.length <= 1 && visCount == 0){
                    table.exclude();
                }
                else {
                    table.show();
                }
                tm.setData(data);
                if (data.length) {
                    sm.setSelectionInterval(0, 0);
                } 
            }
        }
    }
});
