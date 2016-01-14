
const EventEmitter = require('eventemitter3');
const React = require('react');
const ReactDom = require('react-dom');


class BilingualSampleComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accounts: [],
      dao: props.dao
    };
    this.handleGetAccounts = this._handleGetAccounts.bind(this);
    this.state.dao.on('getAccounts', this.handleGetAccounts);
  }
  componentWillReceiveProps(nextProps) {
    this.state.accounts
  }
  _handleGetAccounts(accounts) {
    this.setState({
      accounts: accounts
    });
  }
  render() {
    var rows = this.state.accounts.map((acc) => {
      return <tr><td>{acc.Name}</td></tr>
    });
    var getAccountProcess = (() => {
      this.state.dao.getAccounts();
    }).bind(this);
    return <div>
      <button onClick={getAccountProcess}>Get Accounts</button>
      <br/>
      <table>
        {rows}
      </table>
    </div>;
  }
};


class WebServiceDAO extends EventEmitter {
  constructor() {
    super();
    this.getAccounts = this._getAccounts.bind(this);
  }
  _getAccounts() {
    var accounts = sforce.apex.execute('minoaw.BilingualSample', 'getAccounts', {});
    this.emit('getAccounts', accounts);
  }
}

class LightningDAO extends EventEmitter {
  constructor(cmp) {
    super();
    this.ltng = cmp;
    this.getAccounts = this._getAccounts.bind(this);
  }
  initLightningCallback() {
    this.callback = $A.getCallback(function () {
      this.emit('callback');
    }.bind(this));
  }
  _getAccounts() {
    var self = this;
    this.once('callback', function () {
      var action = this.ltng.get('c.getAccounts');
      action.setCallback(this.ltng, function (response) {
        if (response.state === 'SUCCESS') {
          self.emit('getAccounts', response.returnValue);
        } else {
          self.emit('error', response.error);
        }
      });
      $A.enqueueAction(action);
    });
    this.callback();
  }
}


window.BilingualSample = {
  initLightning: function (target, ltngCmp) {
    var dao = new LightningDAO(ltngCmp);
    dao.initLightningCallback();
    ReactDom.render(<BilingualSampleComponent dao={dao} />, target);
  },
  initVisualforce: function (target) {
    var dao = new WebServiceDAO();
    ReactDom.render(<BilingualSampleComponent dao={dao} />, target);
  }
};

