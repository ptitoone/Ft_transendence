FROM nginx:stable-alpine

#add mod security, load balancer, auto ssl ...
#or move it in frontend production mode and serve static content from build

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./tmp.key /etc/ssl/private
COPY ./tmp.crt /etc/ssl/certs

EXPOSE 80 443
