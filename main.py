from collections import defaultdict, namedtuple
import optparse

import json
from consul import Consul
from flask import Flask, render_template, request, abort, g, jsonify

CONSUL_PREFIX = 'service/uzblmonitor2/'

MonitorConfig = namedtuple('MonitorConfig', "host alias url refresh_rate")

app = Flask('uzblmonitor-ui')


@app.before_request
def before_request():
    g.c = Consul(app.config['consul_host'], app.config['consul_port'])


def mk_key(*pieces):
    return CONSUL_PREFIX + '/'.join(pieces)


def split_key(key):
    """Strip CONSUL_PREFIX and return key parts"""
    return key[len(CONSUL_PREFIX):].split('/')


def get_all_hosts():
    hosts = set()

    _, nodes = g.c.catalog.service('uzblmonitor')
    for node in nodes:
        for tag in node['ServiceTags']:
            k, v = tag.split('=', 1)
            if k == 'fqdn':
                hosts.add(v)

    return hosts


def get_monitor_configs():
    _, objs = g.c.kv.get(mk_key('hosts/'), recurse=True)
    data = defaultdict(dict)  # host -> {k -> v}

    for host in get_all_hosts():
        data[host]  # pre-populate with all existing hosts

    for o in objs or []:
        if o['Value']:
            key_parts = split_key(o['Key'])
            _, host, param = key_parts  # eg. hosts/sfotv11-17.../url
            value = o['Value'].decode("utf-8")
            if param == "state":
                value = json.loads(o['Value'].decode("utf-8"))
            data[host][param] = value

    monitor_configs = []
    for host, v in data.iteritems():
        mc = {'host': host}
        mc.update(v)
        monitor_configs.append(mc)

    return monitor_configs


@app.route('/')
def home():
    monitor_configs = get_monitor_configs()

    return render_template('home.html', monitor_configs=monitor_configs)


@app.route('/monitors', methods=['GET'])
def monitors_get():
    return jsonify({"monitors": get_monitor_configs()})


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

    key = mk_key('hosts', host, 'refresh_rate')
    g.c.kv.delete(key)

    return "", 204


@app.route('/monitor/refresh', methods=['POST'])
def monitor_refresh():
    if set(request.form.keys()) < set(['host']):
        return abort(400)

    host = request.form['host']

    if not host:
        return abort(400)

    key = mk_key('hosts', host, 'state')
    _, data = g.c.kv.get(key)

    if data:
        g.c.kv.put(key, "{}")
        g.c.kv.put(key, data['Value'])

    return "", 204


@app.route('/monitor/update_alias', methods=['POST'])
def monitor_update_alias():
    if set(request.form.keys()) < set(['host', 'value']):
        return abort(400)

    host = request.form['host']
    alias = request.form['value']

    if not host:
        return abort(400)

    key = mk_key('hosts', host, 'alias')

    if alias:
        g.c.kv.put(key, alias)
    else:
        g.c.kv.delete(key)

    return "", 204

@app.route('/monitor/update_refresh_rate', methods=['POST'])
def monitor_update_refresh_rate():
    if set(request.form.keys()) < set(['host', 'value']):
        return abort(400)

    host = request.form['host']
    refresh_rate = request.form['value']

    if not host:
        return abort(400)

    key = mk_key('hosts', host, 'refresh_rate')

    if refresh_rate:
        g.c.kv.put(key, refresh_rate)
    else:
        g.c.kv.delete(key)

    return "", 204

@app.route('/monitor/update', methods=['POST'])
def monitor():
    if set(request.form.keys()) < set(['host', 'state']):
        return abort(400)

    host = request.form['host']
    state = request.form['state']

    if not host:
        return abort(400)

    if not state:
        return "state required", 400

    key = mk_key('hosts', host, 'state')

    g.c.kv.put(key, state)

    return "", 204


def main():
    parser = optparse.OptionParser()
    parser.add_option('--app-host', default='127.0.0.1')
    parser.add_option('--app-port', type=int, default=5001)
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
