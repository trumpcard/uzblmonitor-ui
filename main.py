from collections import defaultdict, namedtuple
import optparse

from consul import Consul
from flask import Flask, render_template, redirect, url_for, request, abort, g

CONSUL_PREFIX = 'service/uzblmonitor/'

MonitorConfig = namedtuple('MonitorConfig', "host alias url")

app = Flask('uzblmonitor-ui')


@app.before_request
def before_request():
    g.c = Consul(app.config['consul_host'], app.config['consul_port'])


def mk_key(*pieces):
    return CONSUL_PREFIX + '/'.join(pieces)


def split_key(key):
    """Strip CONSUL_PREFIX and return key parts"""
    return key[len(CONSUL_PREFIX):].split('/')


def get_monitor_configs():
    _, objs = g.c.kv.get(mk_key('hosts/'), recurse=True)

    data = defaultdict(dict)  # host -> {k -> v}

    for o in objs or []:
        key_parts = split_key(o['Key'])
        _, host, param = key_parts  # eg. hosts/sfotv11-17.../url
        data[host][param] = o['Value']

    host_configs = [
        MonitorConfig(host, params.get('alias'), params.get('url'))
        for host, params in data.iteritems()
    ]

    return host_configs


@app.route('/')
def home():
    monitor_configs = [
        mc._asdict()
        for mc in get_monitor_configs()
    ]

    return render_template('home.html', monitor_configs=monitor_configs)


@app.route('/monitor/create', methods=['POST'])
def monitor_create():
    if set(request.form.keys()) < set(['host', 'url']):
        return abort(400)

    host = request.form['host']
    url = request.form['url']

    if not all((host, url)):
        return abort(400)

    key = mk_key('hosts', host, 'url')

    g.c.kv.put(key, url)

    return redirect(url_for('home'))


@app.route('/monitor/delete', methods=['POST'])
def monitor_delete():
    if set(request.form.keys()) < set(['host']):
        return abort(400)

    host = request.form['host']

    if not host:
        return abort(400)

    key = mk_key('hosts', host, 'url')
    g.c.kv.delete(key)

    key = mk_key('hosts', host, 'alias')
    g.c.kv.delete(key)

    return "", 204


@app.route('/monitor/update_alias', methods=['POST'])
def monitor_update_alias():
    if set(request.form.keys()) < set(['pk', 'value']):
        return abort(400)

    host = request.form['pk']
    alias = request.form['value']

    if not host:
        return abort(400)

    key = mk_key('hosts', host, 'alias')

    if alias:
        g.c.kv.put(key, alias)
    else:
        g.c.kv.delete(key)

    return "", 204


@app.route('/monitor/update_url', methods=['POST'])
def monitor():
    if set(request.form.keys()) < set(['pk', 'value']):
        return abort(400)

    host = request.form['pk']
    url = request.form['value']

    if not host:
        return abort(400)

    if not url:
        return "URL required", 400

    key = mk_key('hosts', host, 'url')

    g.c.kv.put(key, url)

    return "", 204


def main():
    parser = optparse.OptionParser()
    parser.add_option('--app-host', default='127.0.0.1')
    parser.add_option('--app-port', type=int, default=5000)
    parser.add_option('--consul-host', default='127.0.0.1')
    parser.add_option('--consul-port', type=int, default=8500)
    parser.add_option('--debug', action='store_true', default=False)

    opts, _ = parser.parse_args()

    app.config['consul_host'] = opts.consul_host
    app.config['consul_port'] = opts.consul_port

    app.run(
        host=opts.app_host,
        port=opts.app_port,
        debug=opts.debug,
    )


if __name__ == '__main__':
    main()
