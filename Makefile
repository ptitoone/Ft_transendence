NGINX_PID = $(shell netstat -ltpn | grep nginx | head -n 1 | cut -d "/" -f 1 | awk '{print $$7}')

.PHONY: all
all: start

.PHONY: start
start:
ifneq ("$(NGINX_PID)", "")
	kill $(NGINX_PID)
endif
	docker-compose up --build -V --remove-orphans

.PHONY:stop
stop:
	docker-compose down

.PHONY: clean
clean:
	docker system prune --volumes -a

.PHONY: fclean
fclean: clean

.PHONY: re
re: stop fclean start
