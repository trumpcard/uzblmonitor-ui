from collections import defaultdict, namedtuple

from consul import Consul
from flask import Flask, render_template, redirect, url_for, request, abort

PREFIX = 'service/uzblmonitor/'

HostConfig = namedtuple('HostConfig', "host alias url")

app = Flask('uzblmonitor-ui')

c = Consul('192.168.59.103')


def mk_key(*pieces):
    return PREFIX + '/'.join(pieces)


def split_key(key):
    """Strip PREFIX and return key parts"""
    return key[len(PREFIX):].split('/')


def get_monitor_configs():
    _, objs = c.kv.get(mk_key('hosts/'), recurse=True)

    data = defaultdict(dict)  # host -> {k -> v}

    for o in objs or []:
        key_parts = split_key(o['Key'])
        _, host, param = key_parts  # eg. hosts/sfotv11-17.../url
        data[host][param] = o['Value']

    host_configs = [
        HostConfig(host, params.get('alias'), params.get('url'))
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

    c.kv.put(key, url)

    return redirect(url_for('home'))


@app.route('/monitor/delete', methods=['POST'])
def monitor_delete():
    if set(request.form.keys()) < set(['host']):
        return abort(400)

    host = request.form['host']

    if not host:
        return abort(400)

    key = mk_key('hosts', host, 'url')
    c.kv.delete(key)

    key = mk_key('hosts', host, 'alias')
    c.kv.delete(key)

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
        c.kv.put(key, alias)
    else:
        c.kv.delete(key)

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

    c.kv.put(key, url)

    return "", 204


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)
