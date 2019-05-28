#!/bin/bash
echo Server starting
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
while true
do
	echo "Server (re)started"
	npm start
	sleep 1
done
