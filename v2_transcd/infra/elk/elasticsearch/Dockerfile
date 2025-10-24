# Dockerfile Elasticsearch (compatible ELK 8.13.2)
FROM docker.elastic.co/elasticsearch/elasticsearch:8.13.2

USER root

# Installer outils utiles (curl + jq) pour entrypoint (Vault, debug JSON)
RUN apt-get update && \
    apt-get install -y curl jq && \
    rm -rf /var/lib/apt/lists/*

# Copie config et entrypoint
COPY elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER elasticsearch
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/local/bin/docker-entrypoint.sh", "eswrapper"]
