var HostConfig = React.createClass({
  render: function() {
    return (
      <div>
        <strong>{this.props.host}:</strong> {this.props.url}
      </div>
    );
  }
});

var HostConfigs = React.createClass({
  getInitialState: function() {
    return {
      hostConfigs: []
    };
  },

  componentDidMount: function() {
    $.get(this.props.source, function(result) {
      if (this.isMounted()) {
        var newHostConfigs = [];
        for (var i in result.hostConfigs) {
          var host = result.hostConfigs[i].host;
          var url = result.hostConfigs[i].url;
          newHostConfigs.push(
            <HostConfig host={host} url={url} />
          );
        }
        this.setState({
          hostConfigs: newHostConfigs
        });
      }
    }.bind(this));
  },

  render: function() {
    return (
      <div>
        {this.state.hostConfigs[0]}
      </div>
    );
  }
});

React.render(
  <HostConfigs source="/hosts" />,
  document.getElementById('example')
);
