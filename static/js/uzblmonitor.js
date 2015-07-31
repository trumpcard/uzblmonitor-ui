var React = require("react"),
    Select = require('react-select'),
    Fluxxor = require("fluxxor");

window.React = React;

var SUPPORTED_OPTIONS = [
    { value: 'horizontal-split', label: 'Horizontal Split', placeholder: 'Percentage' },
    { value: 'vertical-split', label: 'Vertical Split', placeholder: 'Percentage' },
    { value: 'url', label: 'URL', placeholder: 'URL' },
    { value: 'command', label: 'Command', placeholder: 'Command' }
];
var constants = {
  'MONITORS_LOADED': 'MONITORS_LOADED'
};

var AppStore = Fluxxor.createStore({
    initialize: function() {
        this.monitors = [
        {
    "alias": "OperationsTopRight",
    "host": "sfotv11-16.corp.yelpcorp.com",
    "refresh_rate": "3600",
    "state": {
        "mode": "horizontal-split",
        "value": "10%",
        "children": [
            {
                "mode": "url",
                "value": "world"
            },
            {
                "mode": "url",
                "value": "world"
            }
        ]
    }
}
    ];        
        this.bindActions(
            constants.MONITORS_LOADED, this.onMonitorsLoaded
        )
    },
    onMonitorsLoaded: function(data) {
        this.monitors = data;
        this.emit('change');
    },
    getState: function() {
        return {
            monitors: this.monitors
        };
    }
});


var stores = {AppStore: new AppStore()};
var actions = {
    loadMonitors: function() {
      var self = this;
      $.ajax({
          url: "/monitors",
          success: function (data, textStatus, jqXHR) {
              // self.dispatch(constants.MONITORS_LOADED, data.monitors);
          }
      });
    }
};

var flux = new Fluxxor.Flux(stores, actions);

window.flux = flux;

flux.on("dispatch", function(type, payload) {
    if (console && console.log) {
        console.log("[Dispatch]", type, payload);
    }
});


var FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;


var Form = React.createClass({
    displayName: "Form",
    mixins: [FluxMixin],
    getInitialState: function() {
        return {value: this.props.value}
    },
    onChange: function(e) {
        this.setState({value: e.target.value}, function(){
          this.props.onChange(this.state.value);  
        });
        
    },
    render: function() {
        return (
          <input className="form-control" type="text" onChange={this.onChange} value={this.state.value} placeholder={this.props.placeholder} />
        );
    }
});

var ModeDropdown = React.createClass({
  displayname: 'ModeDropdown',
  mixins: [FluxMixin],
  getInitialState: function() {
    return {
      mode: this.props.state.mode || 'url',
      value: this.props.state.value,
      children: this.props.state.children || null
    };
  },
  onChange: function(value) {
    new_children = [{'mode': 'url', 'value': '', 'children': null}, {'mode': 'url', 'value': '', 'children': null}]
    if(value == 'horizontal-split') {
      this.setState({mode: "horizontal-split", value: '', children: new_children}, function() {
        this.props.onStateUpdate(this.state)
      });
    } else if(value == 'vertical-split') {
      this.setState({mode: "vertical-split", value: '', children: new_children}, function() {
        this.props.onStateUpdate(this.state)
      });
    } else if(value == 'command') {
      this.setState({mode: "command", value: '', children: null}, function() {
        this.props.onStateUpdate(this.state)
      });
    } else if(value == 'url') {
      this.setState({mode: "url", value: '', children: null}, function() {
        this.props.onStateUpdate(this.state)
      });
    }
  },
  updateState: function(state) {
    this.setState({children: state}, function() {
      this.props.onStateUpdate(this.state)  
    });
  },
  updateValue: function(value) {
    this.setState({value: value}, function() {
      this.props.onStateUpdate(this.state)
    });
  },
  render: function () {
    var split, hr, placeholder;
    if(this.state.mode == 'horizontal-split' || this.state.mode == 'vertical-split') {
      split = <Split state={this.props.state.children} onStateUpdate={this.updateState} mode={this.state.mode}/>;
    } else {
      hr = <hr/>;
    }

    for (var i=0; i < SUPPORTED_OPTIONS.length; ++i) {
      if(this.state.mode == SUPPORTED_OPTIONS[i].value) {
        placeholder = SUPPORTED_OPTIONS[i].placeholder;
      }
    }

    return (
      <div>
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-3">
              <Select value={this.state.mode} searchable={false} clearable={false} options={SUPPORTED_OPTIONS} onChange={this.onChange}/>
            </div>
            <div className="col-md-9">
              <Form key={this.state.value} onChange={this.updateValue} value={this.state.value} placeholder={placeholder}/>
            </div>
            
          </div>
          <div className="row">
            {split}
          </div>
        </div>
        {hr}
      </div>
    )
  }
})

var Split = React.createClass({
  displayname: 'Split',
  mixins: [FluxMixin],
  getInitialState: function() {
    if(this.props.state) {
      children = this.props.state;
    } else {
       children = [{'mode': 'url', 'value': '', 'children': null}, {'mode': 'url', 'value': '', 'children': null}]
    }
    return {children: children}; 
  },
  updateAState: function(state){
    this.setState({children: [state, this.state.children[1]]}, function() {
      this.props.onStateUpdate(this.state)
    })
  },
  updateBState: function(state){
    this.setState({children: [this.state.children[0], state]}, function() {
      this.props.onStateUpdate(this.state)
    })
  },
  render: function () {
    
    if(this.props.mode == "horizontal-split") {
      a = "Left";
      b = "Right";
    } else {
      a = "Top";
      b = "Bottom";
    }

    return (
      <div>
        <hr/>
        <div className="row">
          <div className="col-md-1"></div>
          <div className="col-md-11">
            <span className="muted">{a}</span>
            <ModeDropdown state={this.state.children[0]} onStateUpdate={this.updateAState}/>
            <span className="muted">{b}</span>
            <ModeDropdown state={this.state.children[1]} onStateUpdate={this.updateBState}/>
          </div>
        </div>
        <hr/>
      </div>
    )
  }
})

var Host = React.createClass({
  displayName: 'Host',
  mixins: [FluxMixin],
  getInitialState: function() {
    return {
      id: this.props.host.host.replace(/\./g, '_'),
      state: this.props.host.state
    };
  },
  getStateFromFlux: function() {
    return this.getFlux().store('AppStore').getState();
  },
  updateState: function(state) {
    var self = this;
    console.log("UPDATE");
    console.log(this.state)
    console.log(state);
    this.setState({state: state}, function() {
      console.log(this.state)
      self.forceUpdate()
    })
  },
  onSave: function() {
    console.log(this.state);
    console.log(JSON.stringify(this.state))
  },
  render: function() {
    return (
      <div className="host panel panel-default">
        <div className="panel-heading" role="tab">
          <h4 className="panel-title">
            <a role="button" data-toggle="collapse" data-parent="#accordion" href={"#" + this.state.id}>
              <i className="glyphicon glyphicon-plus"></i>
              {this.props.host.alias} ({this.props.host.host})
            </a>
          </h4>
        </div>
        <div id={this.state.id} className="panel-collapse collapse" role="tabpanel">
          <div className="panel-body">
            <ModeDropdown state={this.props.host.state} onStateUpdate={this.updateState}/>
            <div className="container-fluid">
              <button className="pull-right btn btn-success" onClick={this.onSave} type="submit">Save</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
})
var Application = React.createClass({displayName: "Application",
    mixins: [FluxMixin, StoreWatchMixin('AppStore')],

    getInitialState: function() {
        return {};
    },
    componentDidMount: function () {
        this.getFlux().actions.loadMonitors();  
    },
    getStateFromFlux: function() {
        return this.getFlux().store('AppStore').getState();
    },
    render: function() {
        return (
          <div className="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
            {this.state.monitors.map(function(host, i){
                return <Host host={host} key={i} />;
            })}            
          </div>            
        );
    },
});


React.render(React.createElement(Application, {flux: flux}), document.getElementById("app"));