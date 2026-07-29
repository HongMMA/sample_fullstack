.PHONY: run db-up db-down

# DB + API
run:
	./mvn.sh spring-boot:run

# DB만 기동
db-up:
	./mvn.sh exec:exec@db-up

# DB 종료
db-down:
	./mvn.sh exec:exec@db-down
