FROM ubuntu:vivid
MAINTAINER Patrick Lucas <plucas@yelp.com>

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -y python3 python3-pip

ADD . /uzblmonitor-ui

WORKDIR /uzblmonitor-ui
RUN pip3 install -r requirements.txt

EXPOSE 5000

ENTRYPOINT ["/usr/bin/env", "python3", "/uzblmonitor-ui/main.py"]
CMD []
