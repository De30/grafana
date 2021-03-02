FROM alpine:3.13

USER root

COPY scripts scripts
COPY install /usr/local
COPY bin /usr/local/bin

WORKDIR scripts

RUN ./deploy.sh
