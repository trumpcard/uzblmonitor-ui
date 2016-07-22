FROM ubuntu:xenial
MAINTAINER Patrick Lucas <plucas@yelp.com>

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -y python3 python3-pip npm nodejs
RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN npm install -g browserify

ADD . /uzblmonitor-ui

WORKDIR /uzblmonitor-ui
RUN pip3 install -r requirements.txt
RUN npm install && make bundle

EXPOSE 5000

ENTRYPOINT ["/usr/bin/env", "python3", "/uzblmonitor-ui/main.py"]
CMD []
