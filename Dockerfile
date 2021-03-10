FROM nginx:1.15-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/calypso /usr/share/nginx/html