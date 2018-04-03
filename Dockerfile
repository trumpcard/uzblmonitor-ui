FROM ubuntu:xenial

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update
RUN apt-get install -y curl
RUN curl -sS http://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb http://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -y python3 python3-pip nodejs npm yarn
RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN yarn global add browserify

ADD . /uzblmonitor-ui

WORKDIR /uzblmonitor-ui
RUN pip3 install -r requirements.txt
RUN yarn && make bundle

EXPOSE 5000

ENTRYPOINT ["/usr/bin/env", "python3", "/uzblmonitor-ui/main.py"]
CMD []
