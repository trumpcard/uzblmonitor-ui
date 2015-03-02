from collections import namedtuple
import json

from consul import Consul
from flask import Flask, render_template, redirect, url_for, request, abort, jsonify

PREFIX = 'service/uzblmonitor/'

HostConfig = namedtuple('HostConfig', "host url")

app = Flask('uzblmonitor-ui')


class VK(Consul.KV):

    def keys(
            self,
            prefix,
            separator=None,
            token=None,
            dc=None):
        assert not prefix.startswith('/')
        params = {}
        params['keys'] = 1
        if separator:
            params['separator'] = separator
        token = token or self.agent.token
        if token:
            params['token'] = token
        dc = dc or self.agent.dc
        if dc:
            params['dc'] = dc

        def callback(response):
            if response.code == 404:
                data = None
            else:
                data = json.loads(response.body)
            return response.headers['X-Consul-Index'], data

        return self.agent.http.get(
            callback, '/v1/kv/%s' % prefix, params=params)


class Lusnoc(Consul):

    KV = VK

    def __init__(self, *args, **kwargs):
        super(Lusnoc, self).__init__(*args, **kwargs)
        self.kv = self.KV(self)


c = Lusnoc('172.16.10.13')

def mk_key(*pieces):
    return PREFIX + '/'.join(pieces)


def get_hosts():
    _, keys = c.kv.keys(mk_key('hosts/'), separator='/')
    return [k.rsplit('/', 2)[-2] for k in keys]


def get_host_configs():
    _, objs = c.kv.get(mk_key('hosts/'), recurse=True)

    host_configs = []
    for o in objs or []:
        host = o['Key'][len(PREFIX):].split('/', 2)[1]
        url = o['Value']

        host_configs.append(HostConfig(host, url))

    return host_configs


@app.route('/')
def home():
    host_configs = get_host_configs()
    return render_template('home.html', host_configs=host_configs)


@app.route('/host', methods=['POST'])
def host():
    if set(request.form.keys()) < set(['host', 'url', 'submit']):
        return abort(400)

    host = request.form['host']
    url = request.form['url']
    submit = request.form['submit']

    if not all([host, url, submit]):
        return abort(400)

    key = mk_key('hosts', host, 'url')

    if submit in ('Save', 'Create'):
        c.kv.put(key, url)
    elif submit == 'Delete':
        c.kv.delete(key)

    return redirect(url_for('home'))


@app.route('/hosts')
def hosts():
    host_configs = [
        hc._asdict()
        for hc in get_host_configs()
    ]
    return jsonify({
        'hostConfigs': host_configs,
    })


if __name__ == '__main__':
    app.run(debug=True)
