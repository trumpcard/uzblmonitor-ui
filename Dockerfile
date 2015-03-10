FROM ubuntu:trusty
MAINTAINER Patrick Lucas <plucas@yelp.com>

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -y python python-pip python-dev

ADD . /uzblmonitor-ui

WORKDIR /uzblmonitor-ui
RUN pip install -r requirements.txt

EXPOSE 5000

ENTRYPOINT ["/usr/bin/env", "python", "/uzblmonitor-ui/main.py"]
CMD []
