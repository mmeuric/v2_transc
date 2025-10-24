FROM docker.elastic.co/logstash/logstash:8.13.2

USER root

RUN apt-get update && \
    apt-get install -y curl jq && \
    rm -rf /var/lib/apt/lists/*

# Copier la configuration et le pipeline
COPY logstash.yml /usr/share/logstash/config/logstash.yml
COPY pipeline/logstash.conf /usr/share/logstash/pipeline/logstash.conf
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

EXPOSE 5044 5000 9600

# Donner les bons droits à l'utilisateur logstash
RUN chmod +x /usr/local/bin/entrypoint.sh && \
    chown -R logstash:logstash /usr/share/logstash

USER logstash

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
