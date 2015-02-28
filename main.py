from collections import namedtuple

from consul import Consul
from flask import Flask, render_template, redirect, url_for, request, abort

PREFIX = 'service/uzblmonitor'

HostConfig = namedtuple('HostConfig', "host url")

app = Flask('uzblmonitor-ui')
c = Consul()


def get_host_configs():
    _, values = c.kv.get(PREFIX, recurse=True)

    host_configs = []
    for v in values:
        host = v['Key'][len(PREFIX)+1:].split('/', 1)[0]
        if host == 'auth':
            continue

        url = v['Value']

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

    key = "{0}/{1}/url".format(PREFIX, host)

    if submit in ('Save', 'Create'):
        c.kv.put(key, url)
    elif submit == 'Delete':
        c.kv.delete(key)

    return redirect(url_for('hosts'))


app.run(debug=True)
