/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a horizontal form for use atop a visualizer. The argument to the form
 * widget defines the structure of the form.
 *     
 *     [
 *         {
 *           key: 'xyc',             // unique name
 *           label: 'label',    
 *           widget: 'text',
 *           cfg: {},                // widget specific configuration
 *           set: {}                 // normal qx porperties to apply
 *          },
 *          ....
 *     ]
 * 
 * The following widgets are supported: date, text, selectbox
 * 
 *     text: { },
 *     selectBox: { cfg { structure: [ {label: x, value: y}, ...] } },
 *     date: { },                    // following unix tradition, dates are represented in epoc seconds
 *
 * Populate the new form using the setDate method, providing a map
 * with the required data.
 * 
 */
qx.Class.define("ep.ui.FormBar", {
    extend : qx.ui.core.Widget,
    /**
     * @param structure {Array} form structure
     * @param layout {Incstance} qooxdoo layout instance
     * @param formRenderer {Class} formRenderer class
     */
    construct : function(structure,layout,renderer){
        this.base(arguments);
        this._setLayout(layout || new qx.ui.layout.Grow());
        var form = new qx.ui.form.Form();        
        var formCtrl = new qx.data.controller.Form(null, form);
        this._boxCtrl = {};
        for (var i=0;i<structure.length;i++){
            var s = structure[i];
            if (s.key == null){
                throw new Error('the key property is required');
            }            
            var cfg = s.cfg || {};
            var control;
            switch (s.widget){
                case 'date':
                    control = new qx.ui.form.DateField().set({
                        value       : null,
                        dateFormat  : new qx.util.format.DateFormat(this.tr("dd.MM.yyyy")),
                        placeholder : 'now'
                    });
                    break;                                    
                case 'text':
                    control = new qx.ui.form.TextField();
                    break;
                case 'selectBox':
                    control = new qx.ui.form.SelectBox();
                    var ctrl = this._boxCtrl[s.key] = new qx.data.controller.List(null,control,'title');
                    ctrl.setDelegate({
                        bindItem: function(controller, item, index) {
                            controller.bindProperty('key', 'model', null, item, index);
                            controller.bindProperty('title', 'label', null, item, index);
                        }
                    });
                    var sbModel = qx.data.marshal.Json.createModel(cfg.structure || [{ title: '', key: null} ]);
                    ctrl.setModel(sbModel);
                    break;                
                default: 
                    throw new Error("unknown widget type "+s.widget);
                    break;
            }
            if (s.set){
                control.set(s.set);
            }
            form.add(control, s.label,null,s.key);
            if (s.widget == 'date'){
                formCtrl.addBindingOptions(s.key, { 
                    converter: function(data) {
                        if (/^\d+$/.test(String(data))){
                            var d = new Date();
                            d.setTime(parseInt(data)*1000); 
                            return d;
                        }
                        return null;         
                    }
                }, {
                    converter: function(data) {
                        if (qx.lang.Type.isDate(data)){
                            return Math.round((data.getTime()/1000)); 
                        }
                        return data;
                     }
                });
            }
        }
        var model = this._model = formCtrl.createModel(true);
        model.addListener('changeBubble',function(e){
            if (!this._settingData){
                this.fireDataEvent('changeData',this.getData());
            }
        },this);   
        this._add(new (renderer || ep.ui.form.renderer.Top)(form));
    },

    events : {
        /**
         * fire when the form changes content and
         * and provide access to the data
         */
        changeData: 'qx.event.type.Data'
    },

    members: {
        _boxCtrl: null,
        _model: null,
        _settingData: false,
        /**
         * fetch the data for this form
         */
        getData: function(){
            return this._getData(this._model);
        },
        /**
         * load new data into the data main model
         */
        setData: function(data){
            this._setData(this._model,data);
        },
        /**
         * set the data in a selectbox
         */
        setSelectBoxData: function(box,data){
           var model;
           this._settingData = true;
           if (data.length == 0){
                model = qx.data.marshal.Json.createModel([{ title: '', key: null} ]);
            }            
            else {
                model = qx.data.marshal.Json.createModel(data);
            }
            this._boxCtrl[box].setModel(model);
            this._boxCtrl[box].getTarget().resetSelection();
            this._settingData = false;
        },
        /**
         * load new data into a model
         */
        _setData: function(model,data){
            this._settingData = true;
            for (var key in data){
                var setter = 'set'+qx.lang.String.firstUp(key);
                if (model[setter]){
                    model[setter](data[key]);
                }
            }
            this._settingData = false;
            /* only fire ONE */
            this.fireDataEvent('changeData',this.getData());
        },
        /**
         * turn a model object into a plain data structure
         */
        _getData: function(model){
            var props = model.constructor.$$properties;
            var data = {};
            for (var key in props){
                var getter = 'get'+qx.lang.String.firstUp(key);
                data[key] = model[getter](data[key]);
            }
            return data;
        }
    }
});
