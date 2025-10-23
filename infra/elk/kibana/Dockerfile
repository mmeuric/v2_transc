# Dockerfile Kibana (compatible ELK 8.13.2)
FROM docker.elastic.co/kibana/kibana:8.13.2

USER root

# Installer outils utiles (curl + jq) pour entrypoint (Vault, debug JSON)
RUN apt-get update && \
    apt-get install -y curl jq && \
    apt-get clean all

# Copie config et entrypoint
COPY kibana.yml /usr/share/kibana/kibana.yml
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER kibana
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/share/kibana/bin/kibana"]
