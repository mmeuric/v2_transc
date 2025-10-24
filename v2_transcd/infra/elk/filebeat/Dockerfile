FROM docker.elastic.co/beats/filebeat:8.13.2

# Passer en root pour copier la config
USER root

# Copier ta config filebeat.yml dans l'image
COPY filebeat.yml /usr/share/filebeat/filebeat.yml

# Fixer les permissions exigées par Filebeat
RUN chown root:root /usr/share/filebeat/filebeat.yml && \
    chmod 0644 /usr/share/filebeat/filebeat.yml

# Créer un dossier pour tes logs de test
RUN mkdir -p /usr/share/filebeat/test_logs && \
    chown filebeat:filebeat /usr/share/filebeat/test_logs

# Revenir à l’utilisateur Filebeat pour exécution
USER filebeat

# Lancer Filebeat avec la bonne config
CMD ["filebeat", "-e", "-c", "/usr/share/filebeat/filebeat.yml"]
